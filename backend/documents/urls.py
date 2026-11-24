from django.urls import path
from .views import (
    DocumentListCreateView, DocumentDetailView, DocumentReprocessView,
    DocumentChunksListView, DocumentVersionsView, DocumentCompareVersionView,
    KnowledgeCollectionListCreateView, KnowledgeCollectionDetailView,
    PersonalDocumentListCreateView, PersonalDocumentDetailView,
    PersonalDocumentReprocessView, DocumentSummarizeView,
    DocumentStudyMaterialView, PersonalDocumentPreviewView,
    DocumentDownloadView, PersonalDocumentDownloadView,
    PersonalDocumentStatsView, PersonalDocumentBulkUploadView
)

urlpatterns = [
    # Collections API
    path('collections/', KnowledgeCollectionListCreateView.as_view(), name='collection-list-create'),
    path('collections/<uuid:id>/', KnowledgeCollectionDetailView.as_view(), name='collection-detail'),

    # Personal Documents API
    path('personal/stats/', PersonalDocumentStatsView.as_view(), name='personal-document-stats'),
    path('personal/bulk-upload/', PersonalDocumentBulkUploadView.as_view(), name='personal-document-bulk-upload'),
    path('personal/', PersonalDocumentListCreateView.as_view(), name='personal-document-list-create'),
    path('personal/upload/', PersonalDocumentListCreateView.as_view(), name='personal-document-upload'),
    path('personal/<uuid:id>/', PersonalDocumentDetailView.as_view(), name='personal-document-detail'),
    path('personal/<uuid:id>/download/', PersonalDocumentDownloadView.as_view(), name='personal-document-download'),
    path('personal/<uuid:id>/reprocess/', PersonalDocumentReprocessView.as_view(), name='personal-document-reprocess'),
    path('personal/<uuid:id>/preview/', PersonalDocumentPreviewView.as_view(), name='personal-document-preview'),
    path('personal/<uuid:id>/summarize/', DocumentSummarizeView.as_view(), name='personal-document-summarize'),
    path('personal/<uuid:id>/study-materials/', DocumentStudyMaterialView.as_view(), name='personal-document-study-materials'),

    # General Document Intelligence Actions
    path('<uuid:id>/summarize/', DocumentSummarizeView.as_view(), name='document-summarize'),
    path('<uuid:id>/study-materials/', DocumentStudyMaterialView.as_view(), name='document-study-materials'),

    # Institutional / Admin Documents API
    path('', DocumentListCreateView.as_view(), name='document-list-create'),
    path('upload/', DocumentListCreateView.as_view(), name='document-upload'),
    path('<uuid:id>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<uuid:id>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('<uuid:id>/reprocess/', DocumentReprocessView.as_view(), name='document-reprocess'),
    path('<uuid:id>/chunks/', DocumentChunksListView.as_view(), name='document-chunks'),
    path('<uuid:id>/versions/', DocumentVersionsView.as_view(), name='document-versions'),
    path('<uuid:id>/compare/<uuid:other_id>/', DocumentCompareVersionView.as_view(), name='document-compare'),
]
