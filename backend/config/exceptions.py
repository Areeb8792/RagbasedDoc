from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Standardize all API error responses into a consistent JSON shape:
    {
        "success": False,
        "error": {
            "code": "error_code",
            "message": "Human readable summary",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            'success': False,
            'error': {
                'code': getattr(exc, 'default_code', 'api_error'),
                'message': str(exc.detail) if hasattr(exc, 'detail') and isinstance(exc.detail, str) else 'Validation or request error occurred.',
                'details': response.data,
            }
        }
        response.data = error_payload
        return response

    # Unhandled server errors (500)
    logger.error("Unhandled API exception: %s", str(exc), exc_info=True)
    return Response(
        {
            'success': False,
            'error': {
                'code': 'server_error',
                'message': 'An unexpected internal server error occurred. Please try again later.',
                'details': str(exc) if False else None
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
