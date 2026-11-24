import os
import sys
import io
import django
from pathlib import Path

# Setup Django environment
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import fitz  # PyMuPDF
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from accounts.models import User
from documents.models import Document, DocumentChunk, KnowledgeCollection
from rag.services.retriever import retriever
from rag.services.gemini_service import gemini_service

def create_sample_pdf(content_text, filename="storage_lifecycle_test.pdf"):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text(fitz.Point(50, 72), "MORPHEUS DEPLOYMENT LIFECYCLE TEST", fontsize=14)
    page.insert_text(fitz.Point(50, 110), content_text, fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def run_tests():
    print("=" * 70)
    print("MORPHEUS NEXT-STAGE DEPLOYMENT: STORAGE & LIFECYCLE VERIFICATION")
    print("=" * 70)

    # 1. Setup authenticated test user (Student & Admin)
    admin_user, _ = User.objects.get_or_create(
        email="lifecycle_admin@college.edu",
        defaults={'username': 'lifecycle_admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
    )
    admin_user.set_password("AdminPass123!")
    admin_user.save()

    student_user, _ = User.objects.get_or_create(
        email="lifecycle_student@college.edu",
        defaults={'username': 'lifecycle_student', 'role': 'student'}
    )
    student_user.set_password("StudentPass123!")
    student_user.save()

    client = APIClient()
    client.force_authenticate(user=admin_user)

    # 2. Test PDF Upload & Ingestion
    print("\n[Step 1] Testing Document Upload & Ingestion...")
    test_statement = "The Autonomous Robotic Rover project requires exactly 4 LiDAR sensors and 2 stereo cameras for navigation."
    pdf_bytes = create_sample_pdf(test_statement, "rover_specs.pdf")
    upload_file = SimpleUploadedFile("rover_specs.pdf", pdf_bytes, content_type="application/pdf")

    response = client.post('/api/v1/documents/upload/', {
        'title': 'Autonomous Rover Sensor Specs',
        'category': 'Personal Research',
        'description': 'Hardware specification for the rover navigation subsystem.',
        'visibility': 'published',
        'is_personal': False,
        'file': upload_file
    }, format='multipart')

    assert response.status_code == 201, f"Upload failed with {response.status_code}: {response.data}"
    doc_data = response.data.get('document', {})
    doc_id = doc_data.get('id')
    print(f"  -> Uploaded successfully. Document ID: {doc_id}")

    doc = Document.objects.get(id=doc_id)
    assert doc.document_status == 'indexed', f"Status is {doc.document_status}, expected 'indexed'"
    assert doc.chunk_count > 0, "No chunks were indexed"
    assert doc.checksum != '', "Checksum was not computed"
    print(f"  -> Document indexed: {doc.chunk_count} chunk(s), Checksum: {doc.checksum[:16]}...")

    # 3. Test Document Preview
    print("\n[Step 2] Testing Document Structured Preview...")
    preview_res = client.get(f'/api/v1/documents/personal/{doc_id}/preview/')
    
    assert preview_res.status_code == 200, f"Preview failed: {preview_res.status_code}"
    preview_data = preview_res.data
    assert preview_data.get('title') == 'Autonomous Rover Sensor Specs'
    print(f"  -> Preview verified: title='{preview_data.get('title')}', chunks={len(preview_data.get('sample_chunks', []))}")

    # 4. Test Secure Document Download / Content Streaming
    print("\n[Step 3] Testing Secure File Download Streaming...")
    download_res = client.get(f'/api/v1/documents/{doc_id}/download/')
    assert download_res.status_code == 200, f"Download failed: {download_res.status_code}"
    streamed_content = b"".join(download_res.streaming_content)
    assert len(streamed_content) == len(pdf_bytes), f"Streamed {len(streamed_content)} bytes, expected {len(pdf_bytes)}"
    print(f"  -> File streaming verified: {len(streamed_content)} bytes matched exact upload.")

    # 5. Test Document Re-indexing
    print("\n[Step 4] Testing Document Reprocess / Re-indexing...")
    reprocess_res = client.post(f'/api/v1/documents/{doc_id}/reprocess/')
    assert reprocess_res.status_code == 200, f"Reprocess failed: {reprocess_res.status_code}"
    doc.refresh_from_db()
    assert doc.document_status == 'indexed'
    print(f"  -> Reprocessing verified: status='{doc.document_status}', chunk_count={doc.chunk_count}")

    # 6. Test RAG Retrieval & Verification
    print("\n[Step 5] Testing RAG Semantic Retrieval & Evidence Answering...")
    query = "How many LiDAR sensors does the autonomous rover project require?"
    chunks = retriever.retrieve(query, user=student_user)
    matching_chunk = any("LiDAR" in c['content'] for c in chunks)
    assert matching_chunk, "Rover specification chunk not found in top retrieval results"
    print(f"  -> Retrieved {len(chunks)} relevant chunk(s). Best similarity: {chunks[0].get('similarity', 0):.4f}")

    rag_response = gemini_service.generate_grounded_answer(
        query=query,
        retrieved_chunks=chunks,
        conversation_history=[],
        language="English"
    )
    answer_text = rag_response.get('answer', '')
    citations = rag_response.get('cited_sources', [])
    print(f"  -> Gemini Answer: {answer_text}")
    print(f"  -> Grounded Citations: {citations}")
    assert "4" in answer_text or "four" in answer_text.lower(), "Answer does not mention 4 LiDAR sensors"
    assert len(citations) > 0 or "[Source: source_1]" in answer_text, "No citations generated for grounded answer"

    # 7. Test Safe Deletion
    print("\n[Step 6] Testing Document Safe Deletion...")
    delete_res = client.delete(f'/api/v1/documents/{doc_id}/')
    assert delete_res.status_code == 204, f"Delete failed: {delete_res.status_code}"
    assert not Document.objects.filter(id=doc_id).exists(), "Document record still exists after deletion"
    assert not DocumentChunk.objects.filter(document_id=doc_id).exists(), "Chunks still exist after deletion"
    print("  -> Deletion verified: Document and all associated chunks cleanly removed.")

    print("\n" + "=" * 70)
    print("ALL STORAGE, DOWNLOAD, PREVIEW, RETRIEVAL, AND LIFECYCLE TESTS PASSED!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
