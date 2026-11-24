from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import FAQ
from .serializers import FAQSerializer
from accounts.permissions import IsAdminRole
from audit.services import log_audit_event

class StudentFAQListView(generics.ListAPIView):
    serializer_class = FAQSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['question', 'answer']
    ordering_fields = ['order', 'question']

    def get_queryset(self):
        return FAQ.objects.filter(visibility='published').order_by('order', 'question')

class AdminFAQListCreateView(generics.ListCreateAPIView):
    queryset = FAQ.objects.all().order_by('order', '-created_at')
    serializer_class = FAQSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'visibility']
    search_fields = ['question', 'answer']
    ordering_fields = ['order', 'created_at']

    def perform_create(self, serializer):
        faq = serializer.save(created_by=self.request.user)
        log_audit_event(
            actor=self.request.user,
            action='faq_created',
            target_type='FAQ',
            target_id=str(faq.id),
            metadata={'question': faq.question, 'category': faq.category}
        )

class AdminFAQDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    permission_classes = [IsAdminRole]
    lookup_field = 'id'

    def perform_update(self, serializer):
        faq = serializer.save()
        log_audit_event(
            actor=self.request.user,
            action='faq_updated',
            target_type='FAQ',
            target_id=str(faq.id),
            metadata={'question': faq.question}
        )

    def perform_destroy(self, instance):
        faq_id = str(instance.id)
        q = instance.question
        instance.delete()
        log_audit_event(
            actor=self.request.user,
            action='faq_deleted',
            target_type='FAQ',
            target_id=faq_id,
            metadata={'question': q}
        )
