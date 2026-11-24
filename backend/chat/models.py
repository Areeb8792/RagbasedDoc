import uuid
from django.db import models
from django.conf import settings
from documents.models import Document, DocumentChunk, KnowledgeCollection

class Conversation(models.Model):
    SCOPE_CHOICES = (
        ('institutional', 'Institutional Knowledge'),
        ('all_personal', 'All My Documents'),
        ('collection', 'Knowledge Collection'),
        ('document', 'Single Document'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255, default='New Conversation')
    scope = models.CharField(max_length=50, choices=SCOPE_CHOICES, default='institutional', db_index=True)
    collection = models.ForeignKey(
        KnowledgeCollection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    archived = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class Message(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
    )

    STATUS_CHOICES = (
        ('success', 'Success'),
        ('insufficient_evidence', 'Insufficient Evidence'),
        ('error', 'Error'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    content = models.TextField()
    response_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='success')
    insufficient_evidence = models.BooleanField(default=False)
    model_identifier = models.CharField(max_length=100, default='gemini-2.5-flash')
    response_time_ms = models.PositiveIntegerField(default=0)
    follow_up_suggestions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.role.upper()}] {self.content[:40]}..."


class MessageCitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='citations')
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='cited_in_messages')
    document_chunk = models.ForeignKey(DocumentChunk, null=True, blank=True, on_delete=models.SET_NULL)
    citation_order = models.PositiveIntegerField(default=1)
    page_number = models.PositiveIntegerField(null=True, blank=True)
    section_title = models.CharField(max_length=255, blank=True, default='')
    excerpt = models.TextField(blank=True, default='')
    similarity_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['citation_order']

    def __str__(self):
        return f"Citation {self.citation_order} for {self.document.title} (Page {self.page_number or 'N/A'})"


class SavedAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_answers')
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='saved_by_users')
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'message'], name='unique_user_saved_answer')
        ]

    def __str__(self):
        return f"Saved by {self.user.username}: {self.message.content[:30]}"
