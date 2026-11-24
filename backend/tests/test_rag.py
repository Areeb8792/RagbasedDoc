from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from documents.models import Document, DocumentChunk
from chat.models import Conversation, Message
from analytics.models import KnowledgeGap

class RAGPipelineTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username='ragstudent',
            email='ragstudent@college.edu',
            password='Password123!'
        )
        self.other_student = User.objects.create_user(
            username='otherstudent',
            email='other@college.edu',
            password='Password123!'
        )

        self.ask_url = reverse('chat-ask')
        self.conv_url = reverse('chat-conversations')

        # Create seeded test document
        self.doc = Document.objects.create(
            title="Official Attendance Regulation",
            original_filename="attendance.txt",
            category="Attendance",
            document_status="indexed",
            visibility="published"
        )
        from rag.services.embeddings import embedding_service
        content = "Section 1.1: Every enrolled student must maintain at least 75% attendance in theory and practical courses."
        self.chunk1 = DocumentChunk.objects.create(
            document=self.doc,
            chunk_index=0,
            page_number=1,
            section_title="Minimum Attendance",
            content=content,
            embedding=embedding_service.embed_text(content)
        )

    def test_ask_question_returns_grounded_answer_and_citations(self):
        self.client.force_authenticate(user=self.student)

        res = self.client.post(self.ask_url, {
            'question': 'What is the minimum attendance required in courses?'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('message', res.data)
        self.assertIn('conversation_id', res.data)

        # Check citations
        citations = res.data['message']['citations']
        self.assertGreaterEqual(len(citations), 1)
        self.assertEqual(citations[0]['document_title'], "Official Attendance Regulation")

    def test_unanswerable_question_records_knowledge_gap(self):
        self.client.force_authenticate(user=self.student)

        # Query something completely absent
        unanswerable_query = "What is the policy for astronaut submarine parking tickets?"
        res = self.client.post(self.ask_url, {
            'question': unanswerable_query
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Should flag insufficient evidence and create/increment knowledge gap
        self.assertTrue(res.data['message']['insufficient_evidence'])
        self.assertTrue(KnowledgeGap.objects.filter(query_text=unanswerable_query).exists())

    def test_student_cannot_access_another_students_conversation(self):
        # Create conversation for student 1
        conv = Conversation.objects.create(user=self.student, title="Private Chat")

        # Authenticate as student 2 and try to access
        self.client.force_authenticate(user=self.other_student)
        detail_url = reverse('chat-conversation-detail', kwargs={'id': conv.id})
        res = self.client.get(detail_url)

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
