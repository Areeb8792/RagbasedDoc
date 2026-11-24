from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Count
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from documents.models import Document
from chat.models import Message
from feedback.models import Feedback
from .models import KnowledgeGap
from .serializers import KnowledgeGapSerializer
from accounts.permissions import IsAdminRole
from audit.services import log_audit_event

class AdminAnalyticsOverviewView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_users = User.objects.count()
        active_students = User.objects.filter(role='student', is_active=True).count()

        total_docs = Document.objects.count()
        indexed_docs = Document.objects.filter(document_status='indexed').count()
        processing_docs = Document.objects.filter(document_status='processing').count()
        failed_docs = Document.objects.filter(document_status='failed').count()

        assistant_messages = Message.objects.filter(role='assistant')
        total_questions = assistant_messages.count()
        insufficient_evidence_count = assistant_messages.filter(insufficient_evidence=True).count()
        supported_answers_count = total_questions - insufficient_evidence_count

        avg_latency = assistant_messages.aggregate(avg_time=Avg('response_time_ms'))['avg_time'] or 0

        # Feedback scores
        feedback_qs = Feedback.objects.all()
        total_feedbacks = feedback_qs.count()
        positive_feedbacks = feedback_qs.filter(rating='helpful').count()
        feedback_rate = round((positive_feedbacks / total_feedbacks * 100), 1) if total_feedbacks > 0 else 100.0

        # Knowledge gaps count
        unresolved_gaps = KnowledgeGap.objects.filter(status='new').count()

        return Response({
            'users': {
                'total': total_users,
                'active_students': active_students
            },
            'documents': {
                'total': total_docs,
                'indexed': indexed_docs,
                'processing': processing_docs,
                'failed': failed_docs
            },
            'questions': {
                'total': total_questions,
                'supported': supported_answers_count,
                'insufficient_evidence': insufficient_evidence_count,
                'support_rate': round((supported_answers_count / total_questions * 100), 1) if total_questions > 0 else 100.0,
                'avg_latency_ms': int(avg_latency)
            },
            'feedback': {
                'total': total_feedbacks,
                'satisfaction_percentage': feedback_rate
            },
            'unresolved_knowledge_gaps': unresolved_gaps
        })

class AdminAnalyticsQuestionsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        # Category breakdown
        category_counts = []
        for cat_key, _ in Document.CATEGORY_CHOICES:
            cnt = Document.objects.filter(category=cat_key).aggregate(
                c_count=Count('cited_in_messages')
            )['c_count'] or 0
            category_counts.append({'category': cat_key, 'queries': cnt})

        # Last 7 days query volume
        now = timezone.now()
        days_data = []
        for i in range(6, -1, -1):
            day_start = now - timedelta(days=i)
            day_label = day_start.strftime('%a %d')
            day_count = Message.objects.filter(
                role='assistant',
                created_at__date=day_start.date()
            ).count()
            days_data.append({'day': day_label, 'count': day_count})

        return Response({
            'by_category': category_counts,
            'daily_trend': days_data
        })

class AdminKnowledgeGapListView(generics.ListAPIView):
    queryset = KnowledgeGap.objects.all().order_by('-frequency', '-updated_at')
    serializer_class = KnowledgeGapSerializer
    permission_classes = [IsAdminRole]

class AdminKnowledgeGapDetailView(generics.RetrieveUpdateAPIView):
    queryset = KnowledgeGap.objects.all()
    serializer_class = KnowledgeGapSerializer
    permission_classes = [IsAdminRole]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_event(
            actor=request.user,
            action='knowledge_gap_updated',
            target_type='KnowledgeGap',
            target_id=str(kwargs.get('id')),
            metadata=request.data
        )
        return response
