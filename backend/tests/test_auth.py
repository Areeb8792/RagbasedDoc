from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.me_url = reverse('auth-me')

    def test_student_registration_success(self):
        payload = {
            'username': 'newstudent',
            'email': 'newstudent@college.edu',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'New',
            'last_name': 'Student',
            'department': 'Computer Science & Engineering',
            'student_id': 'CS-2025-01'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newstudent').exists())

    def test_duplicate_registration_rejection(self):
        User.objects.create_user(
            username='existing',
            email='existing@college.edu',
            password='Password123!'
        )
        payload = {
            'username': 'existing',
            'email': 'existing@college.edu',
            'password': 'AnotherPassword123!',
            'password_confirm': 'AnotherPassword123!'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_token_generation(self):
        user = User.objects.create_user(
            username='logintest',
            email='logintest@college.edu',
            password='MyPassword123!'
        )
        res = self.client.post(self.login_url, {
            'username': 'logintest',
            'password': 'MyPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', res.data)
        self.assertIn('access', res.data['tokens'])

    def test_login_with_email(self):
        user = User.objects.create_user(
            username='emailtest',
            email='emailuser@college.edu',
            password='MyPassword123!'
        )
        res = self.client.post(self.login_url, {
            'username': 'emailuser@college.edu',
            'password': 'MyPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
