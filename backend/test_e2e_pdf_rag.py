import os
import sys
import django
import fitz  # PyMuPDF

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from documents.models import KnowledgeCollection, Document, DocumentChunk
from chat.models import Conversation, Message

User = get_user_model()

def create_sample_pdf(file_path: str):
    """Generates a genuine multi-page test PDF using PyMuPDF."""
    doc = fitz.open()
    
    # Page 1: Cover
    p1 = doc.new_page()
    p1.insert_text((50, 80), "Quantum Computing Principles & Architecture", fontsize=18)
    p1.insert_text((50, 120), "Department of Advanced Physics & Computer Science\nOfficial Course Material 2026", fontsize=12)
    
    # Page 2: Superposition & Qubit
    p2 = doc.new_page()
    p2.insert_text((50, 80), "Chapter 2: Qubit States and Mathematical Formalism", fontsize=14)
    p2.insert_text((50, 120), (
        "Unlike a classical bit which is strictly 0 or 1, a quantum bit (qubit) can exist in a superposition of states.\n"
        "Mathematically, a pure qubit state is represented as |psi> = alpha|0> + beta|1>, where alpha and beta are complex numbers.\n"
        "The normalization condition requires |alpha|^2 + |beta|^2 = 1, where |alpha|^2 is the probability of measuring state |0>."
    ), fontsize=10)
    
    # Page 3: Entanglement
    p3 = doc.new_page()
    p3.insert_text((50, 80), "Chapter 3: Quantum Entanglement and Non-Locality", fontsize=14)
    p3.insert_text((50, 120), (
        "Quantum entanglement describes composite systems where the state of each particle cannot be described independently.\n"
        "Bell states represent the four maximally entangled two-qubit states, used extensively in quantum teleportation protocols."
    ), fontsize=10)
    
    doc.save(file_path)
    doc.close()
    print(f"Created sample PDF at {file_path}")

def run_e2e_pdf_test():
    print("==================================================================")
    print("MORPHEUS END-TO-END PDF RAG AUDIT TEST")
    print("==================================================================")

    pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_quantum.pdf")
    create_sample_pdf(pdf_path)

    try:
        user, _ = User.objects.get_or_create(
            username='e2e_student',
            defaults={'email': 'e2e@college.edu', 'role': 'student', 'first_name': 'E2E', 'last_name': 'Tester'}
        )
        client = APIClient()
        client.force_authenticate(user=user)

        # 1. Upload PDF
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()

        upload_file = SimpleUploadedFile("quantum_computing.pdf", pdf_bytes, content_type="application/pdf")
        print("\n1. Uploading PDF to /api/v1/documents/personal/upload/...")
        res_upload = client.post('/api/v1/documents/personal/upload/', {
            'title': 'Quantum Computing Principles',
            'file': upload_file,
            'is_personal': True,
            'description': 'Qubits, Superposition and Entanglement Coursework'
        }, format='multipart')

        assert res_upload.status_code == 201, f"Upload failed: {res_upload.data}"
        doc_id = res_upload.data['document']['id']
        doc = Document.objects.get(id=doc_id)
        print(f"   -> Document uploaded successfully (ID: {doc.id}, Status: {doc.document_status})")
        print(f"   -> Extracted Page Count: {doc.page_count}, Chunks Count: {doc.chunks.count()}")
        assert doc.chunks.count() > 0, "No chunks created during PDF extraction!"

        # 2. Ask Grounded Question via /api/v1/chat/ask/
        print("\n2. Asking Grounded Question to /api/v1/chat/ask/...")
        query = "How is a pure qubit state represented mathematically and what is the normalization condition?"
        res_chat = client.post('/api/v1/chat/ask/', {
            'question': query,
            'scope': 'document',
            'document_id': str(doc.id)
        }, format='json')

        assert res_chat.status_code == 200, f"Chat failed: {res_chat.data}"
        msg = res_chat.data['message']
        answer = msg['content']
        citations = msg['citations']

        print(f"   -> Gemini Grounded Answer:\n      {answer}\n")
        print(f"   -> Citations Count: {len(citations)}")
        assert len(citations) > 0, "No citations generated for grounded question!"

        top_citation = citations[0]
        print(f"   -> Citation 1 Target: Document='{top_citation['document_title']}', Page={top_citation['page_number']}, Section='{top_citation['section_title']}'")
        print(f"   -> Excerpt Preview: {top_citation['excerpt'][:120]}...")
        assert top_citation['document_title'] == 'Quantum Computing Principles'
        assert top_citation['page_number'] == 2, f"Expected citation on Page 2, got {top_citation['page_number']}"

        # 3. Test Unsupported Question (Honest Abstention)
        print("\n3. Testing Unsupported Question on this Document...")
        unsupported_query = "What is the tuition fee for the aerospace engineering doctorate program?"
        res_unsupp = client.post('/api/v1/chat/ask/', {
            'question': unsupported_query,
            'scope': 'document',
            'document_id': str(doc.id)
        }, format='json')

        assert res_unsupp.status_code == 200
        unsupp_msg = res_unsupp.data['message']
        print(f"   -> Response Status: {unsupp_msg['response_status']}")
        print(f"   -> Insufficient Evidence Flag: {unsupp_msg['insufficient_evidence']}")
        print(f"   -> Citations Count: {len(unsupp_msg['citations'])}")
        assert unsupp_msg['insufficient_evidence'] == True, "Failed to abstain on unsupported question!"
        assert len(unsupp_msg['citations']) == 0, "Generated fake citations on unsupported question!"
        print("   -> PASSED: Morpheus abstained cleanly with 0 citations.")

        print("\n==================================================================")
        print("END-TO-END PDF RAG AUDIT PASSED WITH 100% SUCCESS!")
        print("==================================================================")

    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

if __name__ == '__main__':
    run_e2e_pdf_test()
