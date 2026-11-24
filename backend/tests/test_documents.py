import os
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from documents.models import Document, DocumentChunk

class DocumentPipelineTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='docadmin',
            email='docadmin@college.edu',
            password='AdminPassword123!',
            role='admin'
        )
        self.student = User.objects.create_user(
            username='docstudent',
            email='docstudent@college.edu',
            password='StudentPassword123!',
            role='student'
        )
        self.upload_url = reverse('document-upload')

    def test_admin_can_upload_and_index_document(self):
        self.client.force_authenticate(user=self.admin)

        sample_content = (
            "INSTITUTIONAL FEE REFUND REGULATION\n\n"
            "Section 1: Complete Refund Policy.\n"
            "Students withdrawing prior to commencement receive a 100% refund minus a $50 processing fee.\n"
            "Withdrawals within 15 days of class commencement are entitled to an 80% tuition refund.\n"
            "No refund is granted after 30 calendar days."
        ).encode('utf-8')

        file_obj = SimpleUploadedFile("fee_refund_policy.txt", sample_content, content_type="text/plain")

        res = self.client.post(self.upload_url, {
            'title': 'Fee Refund Policy',
            'file': file_obj,
            'category': 'Fees and Finance',
            'description': 'Official institutional fee refund guidelines'
        }, format='multipart')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        doc = Document.objects.get(title='Fee Refund Policy')
        self.assertEqual(doc.document_status, 'indexed')
        self.assertGreater(doc.chunks.count(), 0)

    def test_student_cannot_upload_document(self):
        self.client.force_authenticate(user=self.student)
        file_obj = SimpleUploadedFile("hack.txt", b"Unauthorized upload", content_type="text/plain")
        res = self.client.post(self.upload_url, {
            'file': file_obj,
            'category': 'General Policies'
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_document_deletion_cascades_chunks(self):
        self.client.force_authenticate(user=self.admin)
        doc = Document.objects.create(
            title="Temp Policy",
            original_filename="temp.txt",
            category="General Policies",
            uploaded_by=self.admin
        )
        DocumentChunk.objects.create(
            document=doc,
            chunk_index=0,
            content="Temporary chunk",
            embedding=[0.0] * 384
        )
        self.assertEqual(DocumentChunk.objects.filter(document=doc).count(), 1)

        detail_url = reverse('document-detail', kwargs={'id': doc.id})
        res = self.client.delete(detail_url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(DocumentChunk.objects.filter(document_id=doc.id).count(), 0)
