from django.urls import path
from .views import (
    AdminAnalyticsOverviewView, AdminAnalyticsQuestionsView,
    AdminKnowledgeGapListView, AdminKnowledgeGapDetailView
)

urlpatterns = [
    path('overview/', AdminAnalyticsOverviewView.as_view(), name='admin-analytics-overview'),
    path('questions/', AdminAnalyticsQuestionsView.as_view(), name='admin-analytics-questions'),
    path('knowledge-gaps/', AdminKnowledgeGapListView.as_view(), name='admin-knowledge-gaps'),
    path('knowledge-gaps/<uuid:id>/', AdminKnowledgeGapDetailView.as_view(), name='admin-knowledge-gap-detail'),
]
