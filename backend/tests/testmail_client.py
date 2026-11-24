"""
Morpheus — Reusable Testmail.app Integration Client
Official Documentation: https://testmail.app/docs/

Dedicated testing utility for automated inspection of inbound transactional emails
received via Testmail.app (https://api.testmail.app/api/json).

SECURITY:
- Never logs, prints, or exposes API keys in reprs, errors, or tracebacks.
- Exclusively uses Python requests and configured environment variables.
"""

import os
import re
import time
import uuid
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class TestmailError(Exception):
    """Base exception for all Testmail client operations."""
    pass


class TestmailConfigurationError(TestmailError):
    """Raised when required configuration (API key, namespace) is missing or malformed."""
    pass


class TestmailAuthenticationError(TestmailError):
    """Raised when authentication against the Testmail API fails (e.g., 401 Unauthorized)."""
    pass


class TestmailTimeoutError(TestmailError):
    """Raised when polling exceeds the configured deadline without receiving the expected email."""
    pass


class TestmailApiError(TestmailError):
    """Raised when the Testmail API returns an unexpected error response."""
    pass


@dataclass
class TestmailMessage:
    """Structured representation of an email received and parsed by Testmail.app."""
    id: str
    from_address: str
    to_address: str
    subject: str
    text: str
    html: str
    timestamp: int  # Epoch timestamp in milliseconds
    tag: str
    raw: Dict[str, Any] = field(default_factory=dict)

    @property
    def recipient(self) -> str:
        """Alias for to_address."""
        return self.to_address

    @property
    def sender(self) -> str:
        """Alias for from_address."""
        return self.from_address

    def extract_links(self) -> List[str]:
        """Extracts all HTTP/HTTPS URLs present in either HTML or plaintext bodies."""
        content = f"{self.html or ''} {self.text or ''}"
        url_pattern = re.compile(r'https?://[^\s\'"<>]+')
        return list(dict.fromkeys(url_pattern.findall(content)))

    def has_text(self, substring: str, case_sensitive: bool = False) -> bool:
        """Checks if the given substring appears in the subject, plaintext, or HTML body."""
        body = f"{self.subject} {self.text or ''} {self.html or ''}"
        if not case_sensitive:
            return substring.lower() in body.lower()
        return substring in body

    def __repr__(self) -> str:
        return (
            f"<TestmailMessage id='{self.id}' tag='{self.tag}' "
            f"to='{self.to_address}' subject='{self.subject}'>"
        )


class TestmailClient:
    """
    Dedicated client for querying and polling Testmail's REST API.
    
    Testmail is a receiving and email-inspection service for automated testing.
    It does not send emails or replace Django's SMTP email backend.
    """

    DEFAULT_API_URL = "https://api.testmail.app/api/json"

    def __init__(
        self,
        api_key: Optional[str] = None,
        namespace: Optional[str] = None,
        api_url: Optional[str] = None,
        session: Optional[requests.Session] = None
    ):
        if api_key is not None:
            self.api_key = str(api_key).strip()
        else:
            self.api_key = (
                getattr(settings, 'TESTMAIL_API_KEY', None)
                or os.getenv('TESTMAIL_API_KEY', '')
            ).strip()

        if namespace is not None:
            self.namespace = str(namespace).strip().lower()
        else:
            self.namespace = (
                getattr(settings, 'TESTMAIL_NAMESPACE', None)
                or os.getenv('TESTMAIL_NAMESPACE', '')
            ).strip().lower()

        self.api_url = (
            api_url
            or getattr(settings, 'TESTMAIL_API_URL', None)
            or os.getenv('TESTMAIL_API_URL', self.DEFAULT_API_URL)
        ).strip()

        self.session = session or requests.Session()

        if not self.api_key:
            raise TestmailConfigurationError(
                "TESTMAIL_API_KEY is not configured. Set TESTMAIL_API_KEY in the environment or settings."
            )
        if not self.namespace:
            raise TestmailConfigurationError(
                "TESTMAIL_NAMESPACE is not configured. Set TESTMAIL_NAMESPACE in the environment or settings."
            )

    @staticmethod
    def get_current_timestamp_ms() -> int:
        """Returns the current epoch timestamp in integer milliseconds."""
        return int(time.time() * 1000)

    def generate_tag(self, prefix: str = "test") -> str:
        """
        Generates a unique, lowercase alphanumeric tag for test execution isolation.
        Example: test_a1b2c3d4
        """
        clean_prefix = re.sub(r'[^a-zA-Z0-9]', '', prefix).lower()[:10]
        unique_suffix = uuid.uuid4().hex[:8]
        return f"{clean_prefix}{unique_suffix}"

    def generate_address(self, tag: Optional[str] = None, prefix: str = "test") -> tuple[str, str]:
        """
        Generates a unique Testmail receiving address and its associated tag.
        Format: {namespace}.{tag}@inbox.testmail.app
        Returns:
            (email_address, tag)
        """
        assigned_tag = tag or self.generate_tag(prefix=prefix)
        address = f"{self.namespace}.{assigned_tag}@inbox.testmail.app"
        return address, assigned_tag

    def get_emails(
        self,
        tag: Optional[str] = None,
        timestamp_from: Optional[int] = None,
        limit: int = 50
    ) -> List[TestmailMessage]:
        """
        Retrieves matching emails from the Testmail JSON API.

        Args:
            tag: Filter emails tagged with this identifier.
            timestamp_from: Epoch timestamp in milliseconds. Only emails received after this are returned.
            limit: Maximum count of emails to retrieve (default 50).

        Returns:
            List of parsed TestmailMessage instances.
        """
        params: Dict[str, Any] = {
            'apikey': self.api_key,
            'namespace': self.namespace,
            'limit': limit,
        }
        if tag:
            params['tag'] = tag
        if timestamp_from is not None:
            params['timestamp_from'] = int(timestamp_from)

        try:
            response = self.session.get(self.api_url, params=params, timeout=15)
        except requests.RequestException as exc:
            # Mask any potential API key exposure in network error messages
            sanitized_err = str(exc).replace(self.api_key, "***")
            raise TestmailApiError(f"Network error connecting to Testmail API: {sanitized_err}") from None

        if response.status_code in (401, 403):
            raise TestmailAuthenticationError(
                f"Testmail authentication failed (HTTP {response.status_code}). Please verify your TESTMAIL_API_KEY."
            )

        if not response.ok:
            raise TestmailApiError(
                f"Testmail API error (HTTP {response.status_code}): {response.text[:200]}"
            )

        try:
            data = response.json()
        except ValueError:
            raise TestmailApiError(f"Testmail returned non-JSON response: {response.text[:200]}")

        raw_emails = data.get('emails', [])
        parsed_emails = []
        for item in raw_emails:
            parsed_emails.append(
                TestmailMessage(
                    id=str(item.get('id', '')),
                    from_address=item.get('from', '') or item.get('from_parsed', [{}])[0].get('address', ''),
                    to_address=item.get('to', '') or item.get('to_parsed', [{}])[0].get('address', ''),
                    subject=item.get('subject', ''),
                    text=item.get('text', ''),
                    html=item.get('html', ''),
                    timestamp=item.get('timestamp', 0),
                    tag=item.get('tag', ''),
                    raw=item,
                )
            )

        return parsed_emails

    def wait_for_email(
        self,
        tag: str,
        timestamp_from: Optional[int] = None,
        timeout_seconds: int = 30,
        poll_interval: float = 2.0
    ) -> TestmailMessage:
        """
        Polls the Testmail inbox with a bounded timeout until an email with the
        specified tag arrives.

        Args:
            tag: Unique tag attached to the target recipient address.
            timestamp_from: Timestamp in ms before the trigger was executed.
            timeout_seconds: Maximum total duration to poll before raising TestmailTimeoutError.
            poll_interval: Delay between consecutive API polling queries.

        Returns:
            The first matching TestmailMessage.

        Raises:
            TestmailTimeoutError: If no matching email arrives before timeout_seconds expires.
        """
        start_time = time.time()
        deadline = start_time + timeout_seconds

        logger.debug(
            "Starting Testmail polling for tag='%s' with %ds timeout (interval=%.1fs)",
            tag, timeout_seconds, poll_interval
        )

        while time.time() < deadline:
            emails = self.get_emails(tag=tag, timestamp_from=timestamp_from, limit=5)
            if emails:
                logger.info(
                    "Testmail successfully retrieved email for tag='%s' in %.2fs",
                    tag, time.time() - start_time
                )
                return emails[0]

            time.sleep(poll_interval)

        elapsed = time.time() - start_time
        raise TestmailTimeoutError(
            f"Timed out after {elapsed:.1f}s waiting for email with tag '{tag}' at namespace '{self.namespace}'."
        )

    def __repr__(self) -> str:
        """Safe representation that NEVER displays secret API keys."""
        masked_key = "***" if self.api_key else "None"
        return (
            f"TestmailClient(namespace='{self.namespace}', "
            f"api_url='{self.api_url}', api_key='{masked_key}')"
        )
