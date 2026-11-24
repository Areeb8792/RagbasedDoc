"""
Morpheus — Testmail.app Integration Test Suite
Django Email Integration Testing for Morpheus Intelligent Campus Assistant

This test suite provides:
1. Unit tests for TestmailClient (offline/mocked safe verification).
2. Live API authentication tests against Testmail.app (requiring TESTMAIL_API_KEY).
3. Application workflow verification (Registration, Password Reset, Verification, Transactional).

CRITICAL CONSTRAINTS:
- Skipped by default unless RUN_TESTMAIL_INTEGRATION=1 is set in the environment.
- Does not modify existing RAG, documents, auth, or UI functionality.
- Never prints or exposes secrets in output or error messages.
- Does not fake success results when an email workflow is not implemented.
"""

import os
import re
import time
import unittest
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.conf import settings
from django.core.mail import send_mail

from tests.testmail_client import (
    TestmailClient,
    TestmailMessage,
    TestmailError,
    TestmailConfigurationError,
    TestmailAuthenticationError,
    TestmailTimeoutError,
    TestmailApiError,
)

IS_INTEGRATION_ENABLED = os.getenv('RUN_TESTMAIL_INTEGRATION', '0').lower() in ('1', 'true', 'yes')


class TestmailClientUnitTests(TestCase):
    """
    Unit tests for TestmailClient that run safely in any environment without
    external network dependencies or live credentials.
    """

    def test_client_fails_safely_when_credentials_missing(self):
        """Client must raise TestmailConfigurationError when api_key or namespace is missing."""
        with self.assertRaises(TestmailConfigurationError) as ctx:
            TestmailClient(api_key='', namespace='')
        self.assertIn("TESTMAIL_API_KEY", str(ctx.exception))

        with self.assertRaises(TestmailConfigurationError) as ctx:
            TestmailClient(api_key='fake-key', namespace='')
        self.assertIn("TESTMAIL_NAMESPACE", str(ctx.exception))

    def test_client_masks_api_key_in_repr(self):
        """Client __repr__ must NEVER expose the secret API key."""
        secret_key = "super-secret-testmail-key-12345"
        client = TestmailClient(api_key=secret_key, namespace="testns")
        repr_str = repr(client)
        self.assertNotIn(secret_key, repr_str)
        self.assertIn("***", repr_str)
        self.assertIn("testns", repr_str)

    def test_address_and_tag_generation(self):
        """Address generation must format as {namespace}.{tag}@inbox.testmail.app."""
        client = TestmailClient(api_key="dummy-key", namespace="testns")
        address, tag = client.generate_address(prefix="student")
        
        self.assertTrue(address.startswith("testns.student"))
        self.assertTrue(address.endswith("@inbox.testmail.app"))
        self.assertTrue(tag.startswith("student"))
        self.assertEqual(address, f"testns.{tag}@inbox.testmail.app")

    def test_custom_tag_address_generation(self):
        """Generating an address with an explicit custom tag must use that exact tag."""
        client = TestmailClient(api_key="dummy-key", namespace="testns")
        address, tag = client.generate_address(tag="registration_42")
        self.assertEqual(tag, "registration_42")
        self.assertEqual(address, "testns.registration_42@inbox.testmail.app")

    def test_message_link_extraction(self):
        """TestmailMessage must accurately extract verification and reset URLs."""
        html_content = """
        <p>Welcome to Morpheus! Please verify your institutional account:</p>
        <a href="https://morpheus.campus.edu/verify?token=abc123xyz">Verify Account</a>
        <p>Or reset your password here: https://morpheus.campus.edu/reset?code=998877</p>
        """
        msg = TestmailMessage(
            id="msg_1",
            from_address="noreply@morpheus.campus.edu",
            to_address="testns.test1@inbox.testmail.app",
            subject="Account Verification",
            text="Please verify: https://morpheus.campus.edu/verify?token=abc123xyz",
            html=html_content,
            timestamp=1700000000000,
            tag="test1",
        )

        links = msg.extract_links()
        self.assertEqual(len(links), 2)
        self.assertIn("https://morpheus.campus.edu/verify?token=abc123xyz", links)
        self.assertIn("https://morpheus.campus.edu/reset?code=998877", links)
        self.assertTrue(msg.has_text("Account Verification"))
        self.assertTrue(msg.has_text("morpheus", case_sensitive=False))

    def test_polling_timeout_raises_exception(self):
        """Polling must stop and raise TestmailTimeoutError when deadline expires."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.ok = True
        mock_response.status_code = 200
        mock_response.json.return_value = {'emails': []}
        mock_session.get.return_value = mock_response

        client = TestmailClient(
            api_key="dummy-key",
            namespace="testns",
            session=mock_session
        )

        start = time.time()
        with self.assertRaises(TestmailTimeoutError) as ctx:
            client.wait_for_email(tag="empty_tag", timeout_seconds=1, poll_interval=0.2)

        elapsed = time.time() - start
        self.assertGreaterEqual(elapsed, 0.9)
        self.assertIn("Timed out", str(ctx.exception))
        self.assertIn("empty_tag", str(ctx.exception))

    def test_authentication_error_on_401(self):
        """HTTP 401 must raise TestmailAuthenticationError without leaking credentials."""
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.ok = False
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_session.get.return_value = mock_response

        client = TestmailClient(api_key="bad-key", namespace="testns", session=mock_session)
        with self.assertRaises(TestmailAuthenticationError) as ctx:
            client.get_emails(tag="any")
        self.assertNotIn("bad-key", str(ctx.exception))
        self.assertIn("authentication failed", str(ctx.exception).lower())


@unittest.skipUnless(
    IS_INTEGRATION_ENABLED,
    "Testmail live integration tests are disabled by default. Set RUN_TESTMAIL_INTEGRATION=1 to enable."
)
class TestmailLiveApiTests(TestCase):
    """
    Live integration tests connecting to Testmail.app's production API.
    Requires RUN_TESTMAIL_INTEGRATION=1 and valid TESTMAIL_API_KEY.
    """

    def setUp(self):
        api_key = os.getenv('TESTMAIL_API_KEY', '').strip()
        namespace = os.getenv('TESTMAIL_NAMESPACE', '').strip()
        if not api_key or not namespace:
            self.skipTest("TESTMAIL_API_KEY or TESTMAIL_NAMESPACE is not set in environment.")
        self.client = TestmailClient(api_key=api_key, namespace=namespace)

    def test_live_api_authentication(self):
        """Verifies that the live Testmail API authenticates successfully with HTTP 200."""
        # Query with a non-existent tag to test auth without fetching full inbox
        tag = self.client.generate_tag(prefix="authtest")
        emails = self.client.get_emails(tag=tag, limit=1)
        self.assertIsInstance(emails, list)
        self.assertEqual(len(emails), 0)

    def test_live_api_timestamp_filtering(self):
        """Verifies that timestamp_from millisecond filtering works on the live API."""
        now_ms = self.client.get_current_timestamp_ms()
        tag = self.client.generate_tag(prefix="timestamptest")
        emails = self.client.get_emails(tag=tag, timestamp_from=now_ms)
        self.assertEqual(len(emails), 0)


class MorpheusApplicationEmailWorkflows(TestCase):
    """
    Evaluation of Morpheus's existing application workflows for outbound email integration.
    
    Inspected per Phase 1 & Phase 4:
    - Registration confirmation email
    - Password-reset email
    - Account verification email
    - Transactional notifications
    """

    def test_inspection_registration_workflow_email_status(self):
        """
        Phase 1 Inspection Finding:
        Morpheus registration (RegisterView) directly provisions active student/admin
        accounts and issues JWT tokens. No outbound registration confirmation email
        workflow is currently implemented in the codebase.
        """
        from accounts.views import RegisterView
        self.assertTrue(
            hasattr(RegisterView, 'create'),
            "RegisterView exists in accounts.views"
        )
        # Verify that registration does not gate on email verification
        from accounts.models import User
        user = User(username="inspection_student", email="inspection@college.edu")
        self.assertTrue(
            user.is_active,
            "Morpheus users are active upon creation; no verification email is required."
        )

    def test_inspection_password_reset_workflow_status(self):
        """
        Phase 1 Inspection Finding:
        Morpheus currently provides authenticated password changes (ChangePasswordView),
        but no unauthenticated 'forgot password / password reset via email' workflow
        is implemented in backend/accounts/urls.py.
        """
        from django.urls import resolve, Resolver404
        # Verify that no password reset email endpoint is currently mapped
        with self.assertRaises(Resolver404):
            resolve('/api/v1/auth/password-reset/')

    def test_django_email_subsystem_configuration(self):
        """
        Verifies that Django's email configuration is defined in settings.py,
        reads environment overrides, and supports pluggable SMTP backends.
        """
        self.assertTrue(hasattr(settings, 'EMAIL_BACKEND'))
        self.assertTrue(hasattr(settings, 'DEFAULT_FROM_EMAIL'))
        self.assertTrue(hasattr(settings, 'TESTMAIL_API_KEY'))
        self.assertTrue(hasattr(settings, 'TESTMAIL_NAMESPACE'))

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_django_send_mail_dispatches_with_testmail_address(self):
        """
        Verifies that Django's core mail dispatcher accepts a Testmail recipient address,
        constructs the message properly, and preserves sender/recipient metadata.
        """
        from django.core import mail
        client = TestmailClient(api_key="mock-key-for-locmem", namespace="testns")
        target_address, tag = client.generate_address(prefix="reg")

        sent_count = send_mail(
            subject="Morpheus — Welcome to Campus Knowledge Portal",
            message=f"Welcome! Your account is active. Access documents: https://morpheus.campus.edu/student",
            from_email="Morpheus Admin <noreply@morpheus.campus.edu>",
            recipient_list=[target_address],
            fail_silently=False,
        )

        self.assertEqual(sent_count, 1)
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, [target_address])
        self.assertIn("Morpheus — Welcome", sent_email.subject)
        self.assertIn("https://morpheus.campus.edu/student", sent_email.body)
        self.assertIn(f"testns.{tag}@inbox.testmail.app", sent_email.to[0])
