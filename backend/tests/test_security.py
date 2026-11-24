from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User

class SecurityAndAccessControlTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username='secstudent',
            email='secstudent@college.edu',
            password='Password123!',
            role='student'
        )
        self.admin = User.objects.create_user(
            username='secadmin',
            email='secadmin@college.edu',
            password='AdminPassword123!',
            role='admin',
            is_staff=True
        )

    def test_student_forbidden_from_admin_analytics(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('admin-analytics-overview')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_forbidden_from_audit_logs(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('admin-audit-logs')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_denied_from_chat(self):
        url = reverse('chat-ask')
        res = self.client.post(url, {'question': 'Hello?'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_allowed_access_to_analytics_and_audit(self):
        self.client.force_authenticate(user=self.admin)
        res_ov = self.client.get(reverse('admin-analytics-overview'))
        self.assertEqual(res_ov.status_code, status.HTTP_200_OK)

        res_audit = self.client.get(reverse('admin-audit-logs'))
        self.assertEqual(res_audit.status_code, status.HTTP_200_OK)
