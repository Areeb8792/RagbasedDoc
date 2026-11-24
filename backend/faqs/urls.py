from django.urls import path
from .views import StudentFAQListView, AdminFAQListCreateView, AdminFAQDetailView

urlpatterns = [
    path('', StudentFAQListView.as_view(), name='faq-list'),
    path('admin/', AdminFAQListCreateView.as_view(), name='admin-faq-list-create'),
    path('admin/<uuid:id>/', AdminFAQDetailView.as_view(), name='admin-faq-detail'),
]
