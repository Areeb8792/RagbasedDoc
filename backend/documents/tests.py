import os
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from documents.models import KnowledgeCollection, Document, DocumentChunk
from documents.services.ingestion import DocumentIngestionPipeline
from rag.services.retriever import retriever
from rag.services.pipeline import RAGPipeline

User = get_user_model()

class DocumentIntelligenceRAGTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='alice@college.edu',
            username='alice',
            password='password123',
            first_name='Alice',
            last_name='Student',
            role='student'
        )
        self.user2 = User.objects.create_user(
            email='bob@college.edu',
            username='bob',
            password='password123',
            first_name='Bob',
            last_name='Student',
            role='student'
        )

        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)

        self.client2 = APIClient()
        self.client2.force_authenticate(user=self.user2)

    def test_create_collection(self):
        response = self.client1.post('/api/v1/documents/collections/', {
            'name': 'Deep Learning',
            'description': 'Neural network architectures and gradient descent',
            'color': '#EA7957'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        collection_id = response.data['id']
        self.assertEqual(response.data['name'], 'Deep Learning')

        # Verify collection ownership isolation
        resp_user2 = self.client2.get('/api/v1/documents/collections/')
        self.assertEqual(len(resp_user2.data.get('results', resp_user2.data)), 0)

    def test_upload_and_isolated_retrieval(self):
        # 1. Create collection for Alice
        collection = KnowledgeCollection.objects.create(
            name='Machine Learning',
            description='Algorithms and optimization',
            owner=self.user1
        )

        # 2. Upload text document to Alice's collection
        doc_content = (
            "Gradient Descent is a first-order iterative optimization algorithm for finding a local minimum "
            "of a differentiable function. The learning rate hyperparameter determines the step size at each iteration. "
            "Stochastic Gradient Descent (SGD) computes the gradient on a single randomly selected training example."
        ).encode('utf-8')
        uploaded_file = SimpleUploadedFile("gradient_descent.txt", doc_content, content_type="text/plain")

        response = self.client1.post('/api/v1/documents/personal/upload/', {
            'title': 'Gradient Descent Notes',
            'file': uploaded_file,
            'collection_id': str(collection.id),
            'is_personal': True
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        doc_id = response.data['document']['id']
        doc = Document.objects.get(id=doc_id)

        self.assertEqual(doc.is_personal, True)
        self.assertEqual(doc.collection_id, collection.id)
        self.assertEqual(doc.document_status, 'indexed')
        self.assertGreater(doc.chunks.count(), 0)

        # 3. Test Retrieval with Alice's collection scope
        results = retriever.retrieve(
            query="What is the learning rate in Gradient Descent?",
            user=self.user1,
            scope="collection",
            collection_id=str(collection.id)
        )
        self.assertGreater(len(results), 0)
        self.assertIn("Gradient Descent", results[0]['content'])

        # 4. Strict Isolation: Bob must NOT be able to retrieve Alice's personal document
        bob_results = retriever.retrieve(
            query="What is the learning rate in Gradient Descent?",
            user=self.user2,
            scope="collection",
            collection_id=str(collection.id)
        )
        self.assertEqual(len(bob_results), 0)

    def test_document_summary_and_study_materials(self):
        doc = Document.objects.create(
            title='Computer Networks Protocols',
            original_filename='networks.txt',
            file_type='txt',
            is_personal=True,
            uploaded_by=self.user1,
            document_status='indexed'
        )
        DocumentChunk.objects.create(
            document=doc,
            chunk_index=0,
            content=(
                "Transmission Control Protocol (TCP) provides reliable, ordered, and error-checked delivery of a stream "
                "of octets between applications running on hosts communicating via an IP network. TCP uses a three-way handshake."
            ),
            page_number=1,
            section_title="Transport Layer"
        )

        # Summarize
        sum_resp = self.client1.post(f'/api/v1/documents/personal/{doc.id}/summarize/')
        self.assertEqual(sum_resp.status_code, status.HTTP_200_OK)
        self.assertIn('summary', sum_resp.data)

        # Study materials
        quiz_resp = self.client1.post(f'/api/v1/documents/personal/{doc.id}/study-materials/')
        self.assertEqual(quiz_resp.status_code, status.HTTP_200_OK)
        self.assertIn('study_materials', quiz_resp.data)
        self.assertIn('practice_questions', quiz_resp.data['study_materials'])
