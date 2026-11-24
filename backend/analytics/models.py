import uuid
from django.db import models

class KnowledgeGap(models.Model):
    STATUS_CHOICES = (
        ('new', 'New Unanswered Query'),
        ('under_review', 'Under Administrative Review'),
        ('resolved', 'Resolved by Document/FAQ Upload'),
        ('dismissed', 'Dismissed / Out of Scope'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query_text = models.CharField(max_length=500, unique=True, db_index=True)
    category = models.CharField(max_length=60, default='General Policies', db_index=True)
    frequency = models.PositiveIntegerField(default=1, db_index=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new', db_index=True)
    resolution_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-frequency', '-updated_at']

    def __str__(self):
        return f"[{self.frequency}x] {self.query_text[:50]} ({self.get_status_display()})"
