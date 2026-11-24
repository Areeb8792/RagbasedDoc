import uuid
from django.db import models
from django.conf import settings
from documents.models import Document

class FAQ(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.CharField(max_length=500, db_index=True)
    answer = models.TextField()
    category = models.CharField(max_length=60, default='General Policies', db_index=True)
    related_documents = models.ManyToManyField(Document, blank=True, related_name='faqs')
    visibility = models.CharField(
        max_length=20,
        choices=(('published', 'Published'), ('draft', 'Draft')),
        default='published',
        db_index=True
    )
    order = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_faqs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"[{self.category}] {self.question[:60]}"
