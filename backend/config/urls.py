from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def landing_page(request):
    """TESSER — Morpheus Visual Fidelity Restoration Landing Page"""
    return render(request, 'landing.html')

def react_spa_view(request, *args, **kwargs):
    """Serves the compiled React Vite SPA index.html for client-side routing in production"""
    dist_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return landing_page(request)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """System health check endpoint"""
    return Response({
        'status': 'healthy',
        'service': 'G38 AI College Assistant',
        'version': '1.0.0',
        'ai_model': settings.GEMINI_MODEL,
        'embedding_model': settings.EMBEDDING_MODEL_NAME,
    })

urlpatterns = [
    path('', landing_page, name='landing'),
    path('admin/', admin.site.urls),

    # API v1 endpoints
    path('api/v1/health/', health_check, name='health-check'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/documents/', include('documents.urls')),
    path('api/v1/chat/', include('chat.urls')),
    path('api/v1/feedback/', include('feedback.urls')),
    path('api/v1/faqs/', include('faqs.urls')),
    path('api/v1/admin/analytics/', include('analytics.urls')),
    path('api/v1/admin/audit-logs/', include('audit.urls')),

    # OpenAPI Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # React Single Page Application (SPA) client routes
    re_path(r'^(?:login|register|student|admin-portal|forgot-password|reset-password).*$', react_spa_view, name='react-spa'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
