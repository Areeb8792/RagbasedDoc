import os
import sys
import unittest
from unittest.mock import MagicMock, patch
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rag.services.gemini_service import GeminiService

class GeminiFailoverAndErrorHandlingTests(unittest.TestCase):
    def setUp(self):
        self.service = GeminiService()

    def test_primary_to_fallback_failover_on_503(self):
        """Simulate primary model returning 503 Service Unavailable; verify automatic fallback."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"answer": "Grounded answer from fallback model", "cited_sources": ["source_1"]}'

        # First call (primary model) raises 503; second call (fallback model) succeeds
        mock_client.models.generate_content.side_effect = [
            Exception("503 UNAVAILABLE. This model is currently experiencing high demand."),
            mock_response
        ]

        with patch.object(GeminiService, 'client', new=mock_client):
            res_text = self.service._call_gemini_with_fallback("Test prompt", is_json=True)
            self.assertIn("Grounded answer from fallback model", res_text)
            self.assertEqual(mock_client.models.generate_content.call_count, 2)
            # Verify first call used primary model and second used candidate fallback
            first_model = mock_client.models.generate_content.call_args_list[0].kwargs['model']
            second_model = mock_client.models.generate_content.call_args_list[1].kwargs['model']
            self.assertNotEqual(first_model, second_model)

    def test_failover_on_429_rate_limit(self):
        """Simulate primary model returning 429 Too Many Requests; verify automatic fallback."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"answer": "Answer after rate limit failover", "cited_sources": []}'

        mock_client.models.generate_content.side_effect = [
            Exception("429 RESOURCE_EXHAUSTED. Rate limit exceeded."),
            mock_response
        ]

        with patch.object(GeminiService, 'client', new=mock_client):
            res_text = self.service._call_gemini_with_fallback("Test prompt", is_json=True)
            self.assertIn("Answer after rate limit failover", res_text)

    def test_all_models_failing_triggers_graceful_grounded_fallback(self):
        """When all external LLM calls fail, verify generate_grounded_answer falls back gracefully without crashing."""
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("403 API_KEY_INVALID")

        sample_chunks = [{
            'document_id': '11111111-1111-1111-1111-111111111111',
            'document_title': 'Policy Handbook',
            'page_number': 5,
            'section_title': 'Attendance Rules',
            'content': 'Minimum attendance required is 75% for all regular students.',
            'similarity': 0.85
        }]

        with patch.object(GeminiService, 'client', new=mock_client):
            output = self.service.generate_grounded_answer(
                query="What is the attendance requirement?",
                retrieved_chunks=sample_chunks
            )
            # Should gracefully deliver grounded response directly from top chunk
            self.assertFalse(output['insufficient_evidence'])
            self.assertIn("75%", output['answer'])
            self.assertEqual(output['cited_sources'], ['source_1'])

    def test_invalid_api_key_initialization(self):
        """Verify missing or empty API key is handled cleanly."""
        service_no_key = GeminiService()
        service_no_key.api_key = ''
        service_no_key._client = None
        self.assertIsNone(service_no_key.client)

if __name__ == '__main__':
    unittest.main()
