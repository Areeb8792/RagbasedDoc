from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Feedback
from .serializers import FeedbackCreateSerializer, FeedbackDetailSerializer
from accounts.permissions import IsAdminRole
from audit.services import log_audit_event

class SubmitFeedbackView(generics.CreateAPIView):
    serializer_class = FeedbackCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        feedback = serializer.save(user=self.request.user)
        log_audit_event(
            actor=self.request.user,
            action='feedback_submitted',
            target_type='Feedback',
            target_id=str(feedback.id),
            metadata={'rating': feedback.rating, 'issue_type': feedback.issue_type}
        )

class AdminFeedbackListView(generics.ListAPIView):
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackDetailSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['rating', 'issue_type', 'status']
    search_fields = ['comment', 'admin_notes', 'user__email']
    ordering_fields = ['created_at', 'rating', 'status']

class AdminFeedbackDetailView(generics.RetrieveUpdateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackDetailSerializer
    permission_classes = [IsAdminRole]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if 'status' in request.data and request.data['status'] == 'resolved':
            serializer.validated_data['resolved_at'] = timezone.now()

        self.perform_update(serializer)
        log_audit_event(
            actor=request.user,
            action='feedback_status_updated',
            target_type='Feedback',
            target_id=str(instance.id),
            metadata=request.data
        )
        return Response(serializer.data)
