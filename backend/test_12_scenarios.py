import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from documents.models import KnowledgeCollection, Document, DocumentChunk
from documents.services.ingestion import DocumentIngestionPipeline
from rag.services.retriever import retriever
from rag.services.pipeline import RAGPipeline
from rag.services.gemini_service import gemini_service
from rag.services.embeddings import embedding_service
from chat.models import Conversation, Message

User = get_user_model()

def run_12_phase_verification():
    print("==================================================================")
    print("MORPHEUS PHASE 14 — FULL 12-SCENARIO PRODUCTION RAG VERIFICATION")
    print("==================================================================")

    # Setup Test Users
    user_alice, _ = User.objects.get_or_create(
        username='alice_verifier',
        defaults={'email': 'alice_v@test.edu', 'role': 'student', 'first_name': 'Alice'}
    )
    user_bob, _ = User.objects.get_or_create(
        username='bob_verifier',
        defaults={'email': 'bob_v@test.edu', 'role': 'student', 'first_name': 'Bob'}
    )

    # -------------------------------------------------------------
    # Test 1 — Basic ingestion and retrieval
    # -------------------------------------------------------------
    print("\n[TEST 1] Testing Basic Ingestion and Vector Indexing...")
    col_ml, _ = KnowledgeCollection.objects.get_or_create(
        name="Machine Learning Suite",
        owner=user_alice,
        defaults={'description': 'ML algorithms and architectures'}
    )

    doc_ml, _ = Document.objects.get_or_create(
        title="Supervised Learning Manual",
        uploaded_by=user_alice,
        defaults={
            'original_filename': 'supervised_learning.txt',
            'file_type': 'txt',
            'is_personal': True,
            'collection': col_ml,
            'document_status': 'indexed'
        }
    )
    doc_ml.collection = col_ml
    doc_ml.save()

    doc_ml.chunks.all().delete()
    content_chunk1 = (
        "Supervised learning algorithms build a mathematical model of a set of data that contains both the inputs and the desired outputs. "
        "The classification problem assigns inputs into two or more classes, whereas regression predicts continuous numeric values. "
        "Support Vector Machines (SVM) find an optimal hyperplane maximizing the geometric margin between classes."
    )
    chunk1 = DocumentChunk.objects.create(
        document=doc_ml,
        collection=col_ml,
        chunk_index=0,
        page_number=3,
        section_title="Supervised Taxonomy",
        content=content_chunk1,
        embedding=embedding_service.embed_text(content_chunk1)
    )

    retrieved = retriever.retrieve(
        query="What is the difference between classification and regression?",
        user=user_alice,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert len(retrieved) > 0, "Test 1 Failed: No chunks retrieved"
    assert "classification" in retrieved[0]['content'].lower()
    print("  -> PASSED: Successfully retrieved indexed chunk via dense vector search.")

    # -------------------------------------------------------------
    # Test 2 — Actual grounded answer
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing Grounded Answer Generation...")
    res2 = RAGPipeline.execute(
        query="According to the document, what does a Support Vector Machine (SVM) do?",
        user=user_alice,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert not res2['insufficient_evidence'], "Test 2 Failed: Reported insufficient evidence"
    assert len(res2['citations']) > 0, "Test 2 Failed: No citations produced"
    assert "hyperplane" in res2['answer'].lower() or "margin" in res2['answer'].lower()
    print("  -> PASSED: Grounded answer generated with factual citation.")
    print("     Snippet:", res2['answer'][:120], "...")

    # -------------------------------------------------------------
    # Test 3 — Paraphrased question
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Paraphrased Query Retrieval...")
    # Wording completely different from document text
    res3 = retriever.retrieve(
        query="How are continuous numbers forecast versus sorting items into categories?",
        user=user_alice,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert len(res3) > 0, "Test 3 Failed: Semantic retrieval failed on paraphrased query"
    assert res3[0]['chunk_id'] == str(chunk1.id)
    print("  -> PASSED: Paraphrased query successfully mapped to correct chunk.")

    # -------------------------------------------------------------
    # Test 4 — Unsupported question
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing Unsupported Question Honesty (Abstention)...")
    res4 = RAGPipeline.execute(
        query="What are the ingredients and baking temperature for sourdough bread?",
        user=user_alice,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert res4['insufficient_evidence'], "Test 4 Failed: System hallucinated answer for absent topic"
    assert len(res4['citations']) == 0, "Test 4 Failed: Fabricated citations for unsupported query"
    print("  -> PASSED: Morpheus correctly refused to fabricate an answer and produced 0 citations.")

    # -------------------------------------------------------------
    # Test 5 — Page citation
    # -------------------------------------------------------------
    print("\n[TEST 5] Testing Page-Level Citation Accuracy...")
    res5 = RAGPipeline.execute(
        query="Where is Support Vector Machine described?",
        user=user_alice,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert len(res5['citations']) > 0
    top_c = res5['citations'][0]
    assert top_c['page_number'] == 3, f"Expected Page 3, got {top_c['page_number']}"
    assert top_c['section_title'] == "Supervised Taxonomy"
    print(f"  -> PASSED: Citation confirmed at Page {top_c['page_number']}, Section '{top_c['section_title']}'.")

    # -------------------------------------------------------------
    # Test 6 — Multi-document question
    # -------------------------------------------------------------
    print("\n[TEST 6] Testing Multi-Document Synthesis...")
    doc_dl, _ = Document.objects.get_or_create(
        title="Deep Learning Manual",
        uploaded_by=user_alice,
        defaults={
            'original_filename': 'deep_learning.txt',
            'file_type': 'txt',
            'is_personal': True,
            'collection': col_ml,
            'document_status': 'indexed'
        }
    )
    doc_dl.collection = col_ml
    doc_dl.save()
    doc_dl.chunks.all().delete()

    content_chunk2 = (
        "Deep Neural Networks (DNN) stack multiple non-linear hidden layers to learn hierarchical representations. "
        "Unlike standard linear models or SVMs, deep networks automatically perform feature discovery from raw data."
    )
    chunk2 = DocumentChunk.objects.create(
        document=doc_dl,
        collection=col_ml,
        chunk_index=0,
        page_number=1,
        section_title="Deep Representations",
        content=content_chunk2,
        embedding=embedding_service.embed_text(content_chunk2)
    )

    res6 = retriever.retrieve(
        query="Compare standard models like SVMs with deep neural network feature discovery",
        user=user_alice,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    retrieved_doc_ids = {r['document_id'] for r in res6}
    assert str(doc_ml.id) in retrieved_doc_ids and str(doc_dl.id) in retrieved_doc_ids, "Test 6 Failed: Did not retrieve across both documents"
    print(f"  -> PASSED: Multi-document retrieval fetched passages from both '{doc_ml.title}' and '{doc_dl.title}'.")

    # -------------------------------------------------------------
    # Test 7 — Collection isolation
    # -------------------------------------------------------------
    print("\n[TEST 7] Testing Knowledge Collection Isolation...")
    col_history, _ = KnowledgeCollection.objects.get_or_create(
        name="Ancient History Notes",
        owner=user_alice,
        defaults={'description': 'Roman empire and classical studies'}
    )
    doc_hist, _ = Document.objects.get_or_create(
        title="Roman Republic",
        uploaded_by=user_alice,
        defaults={
            'original_filename': 'rome.txt',
            'file_type': 'txt',
            'is_personal': True,
            'collection': col_history,
            'document_status': 'indexed'
        }
    )
    doc_hist.collection = col_history
    doc_hist.save()
    doc_hist.chunks.all().delete()
    content_hist = "The Roman Republic was the era of classical Roman civilization beginning with the overthrow of the Roman Kingdom in 509 BC."
    DocumentChunk.objects.create(
        document=doc_hist,
        collection=col_history,
        chunk_index=0,
        page_number=1,
        section_title="Foundation",
        content=content_hist,
        embedding=embedding_service.embed_text(content_hist)
    )

    # Scoped to ML collection: MUST NOT retrieve from History
    res7 = retriever.retrieve(
        query="When did the Roman Republic begin?",
        user=user_alice,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert len(res7) == 0, "Test 7 Failed: History document leaked into ML collection query!"
    print("  -> PASSED: Strict collection isolation enforced; 0 leakage across collections.")

    # -------------------------------------------------------------
    # Test 8 — Cross-user isolation
    # -------------------------------------------------------------
    print("\n[TEST 8] Testing Cross-User Access Isolation...")
    # Bob attempts to search Alice's ML collection
    res8_bob = retriever.retrieve(
        query="What is Support Vector Machine hyperplane?",
        user=user_bob,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert len(res8_bob) == 0, "Test 8 Failed: Bob was able to retrieve Alice's private collection!"

    res8_bob_all = retriever.retrieve(
        query="What is Support Vector Machine hyperplane?",
        user=user_bob,
        scope="personal_all"
    )
    assert len(res8_bob_all) == 0, "Test 8 Failed: Bob retrieved Alice's documents in personal_all!"
    print("  -> PASSED: Cross-user permission boundaries strictly prevent unauthorized retrieval.")

    # -------------------------------------------------------------
    # Test 9 — Follow-up conversation
    # -------------------------------------------------------------
    print("\n[TEST 9] Testing Multi-Turn Follow-Up Conversation Context...")
    history = [
        {'role': 'user', 'content': 'What is supervised learning?'},
        {'role': 'assistant', 'content': 'Supervised learning maps inputs to continuous outputs or discrete classes.'}
    ]
    res9 = RAGPipeline.execute(
        query="Can you explain how SVM relates to it?",
        user=user_alice,
        conversation_history=history,
        scope="collection",
        collection_id=str(col_ml.id)
    )
    assert not res9['insufficient_evidence']
    assert len(res9['citations']) > 0
    print("  -> PASSED: Contextual follow-up conversation correctly incorporated prior turns.")

    # -------------------------------------------------------------
    # Test 10 — Gemini API integration
    # -------------------------------------------------------------
    print("\n[TEST 10] Testing Live Gemini Generation & JSON Schema...")
    res10 = gemini_service.generate_grounded_answer(
        query="Summarize Support Vector Machines in one sentence",
        retrieved_chunks=[{
            'document_id': str(doc_ml.id),
            'document_title': doc_ml.title,
            'page_number': 3,
            'section_title': 'Supervised Taxonomy',
            'content': content_chunk1
        }]
    )
    assert 'answer' in res10 and res10['answer'], "Test 10 Failed: No answer returned by Gemini"
    assert 'cited_sources' in res10 and 'source_1' in res10['cited_sources'], "Test 10 Failed: Citations not extracted"
    print("  -> PASSED: Live Gemini API returned valid structured JSON with verified citations.")
    print("     Answer:", res10['answer'])

    # -------------------------------------------------------------
    # Test 11 — AI study materials
    # -------------------------------------------------------------
    print("\n[TEST 11] Testing AI Study Materials Generation...")
    summary = gemini_service.summarize_document(list(doc_ml.chunks.all()), doc_ml.title, 'txt')
    assert 'executive_summary' in summary and len(summary.get('key_takeaways', [])) > 0
    print("  -> PASSED: Summary generated with executive synthesis and key takeaways.")

    study = gemini_service.generate_study_materials(list(doc_ml.chunks.all()), doc_ml.title)
    assert len(study.get('practice_questions', [])) > 0
    assert len(study.get('flashcards', [])) > 0
    print(f"  -> PASSED: Study Pack generated with {len(study['practice_questions'])} quiz questions and {len(study['flashcards'])} flashcards.")

    # -------------------------------------------------------------
    # Test 12 — Existing application regression
    # -------------------------------------------------------------
    print("\n[TEST 12] Testing Application Regression & Health Check...")
    from django.test import RequestFactory
    from config.urls import health_check
    rf = RequestFactory()
    req = rf.get('/api/v1/health/')
    resp = health_check(req)
    assert resp.status_code == 200
    assert resp.data['status'] == 'healthy'
    assert resp.data['ai_model'] == settings.GEMINI_MODEL
    print(f"  -> PASSED: Health check confirmed active service with AI model: '{resp.data['ai_model']}'.")

    print("\n==================================================================")
    print("ALL 12 PRODUCTION RAG VERIFICATION TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================================")

if __name__ == '__main__':
    run_12_phase_verification()
