from django.urls import path
from .views import (
    ConversationListCreateView, ConversationDetailView,
    AskQuestionView, SimplifyMessageView,
    SavedAnswerListCreateView, SavedAnswerDeleteView,
    ExportConversationView
)

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='chat-conversations'),
    path('conversations/<uuid:id>/', ConversationDetailView.as_view(), name='chat-conversation-detail'),
    path('conversations/<uuid:id>/export/', ExportConversationView.as_view(), name='chat-export'),
    path('ask/', AskQuestionView.as_view(), name='chat-ask'),
    path('messages/<uuid:id>/simplify/', SimplifyMessageView.as_view(), name='chat-simplify'),
    path('saved-answers/', SavedAnswerListCreateView.as_view(), name='chat-saved-answers'),
    path('saved-answers/<uuid:message_id>/', SavedAnswerDeleteView.as_view(), name='chat-saved-answer-delete'),
]
