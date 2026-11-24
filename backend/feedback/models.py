import uuid
from django.db import models
from django.conf import settings
from chat.models import Message

class Feedback(models.Model):
    RATING_CHOICES = (
        ('helpful', 'Helpful (Thumbs Up)'),
        ('not_helpful', 'Not Helpful (Thumbs Down)'),
        ('incorrect', 'Reported Incorrect'),
        ('unsupported', 'Reported Unsupported / Hallucinated'),
    )

    ISSUE_CHOICES = (
        ('none', 'No Issue / Positive Feedback'),
        ('factual_error', 'Factual Error / Wrong Numbers'),
        ('outdated_policy', 'Outdated Regulation or Policy'),
        ('missing_context', 'Missing Context / Incomplete'),
        ('wrong_citation', 'Wrong Citation or Page Reference'),
        ('other', 'Other Issue'),
    )

    STATUS_CHOICES = (
        ('new', 'New Report'),
        ('under_review', 'Under Administrative Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedbacks'
    )
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='feedback_entries')
    rating = models.CharField(max_length=30, choices=RATING_CHOICES, db_index=True)
    issue_type = models.CharField(max_length=40, choices=ISSUE_CHOICES, default='none', db_index=True)
    comment = models.TextField(blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new', db_index=True)
    admin_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else 'Anonymous'
        return f"[{self.get_rating_display()}] by {user_str} on message {self.message_id}"
