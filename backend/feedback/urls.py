from django.urls import path
from .views import SubmitFeedbackView, AdminFeedbackListView, AdminFeedbackDetailView

urlpatterns = [
    path('', SubmitFeedbackView.as_view(), name='feedback-submit'),
    path('admin/', AdminFeedbackListView.as_view(), name='admin-feedback-list'),
    path('admin/<uuid:id>/', AdminFeedbackDetailView.as_view(), name='admin-feedback-detail'),
]
