import uuid
from django.db import models
from django.conf import settings

def get_embedding_field():
    if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
        try:
            from pgvector.django import VectorField
            return VectorField(dimensions=settings.EMBEDDING_DIMENSION, null=True, blank=True)
        except Exception:
            return models.JSONField(default=list, blank=True)
    return models.JSONField(default=list, blank=True)


class KnowledgeCollection(models.Model):
    """
    Groups user-uploaded documents by topic, project, or subject
    (e.g., 'Machine Learning', 'Computer Networks', 'Personal Research', 'Bylaws').
    Enforces domain-agnostic retrieval isolation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='knowledge_collections'
    )
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, default='')
    color = models.CharField(max_length=30, default='#EA7957')
    icon = models.CharField(max_length=50, default='folder', blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.owner.username})"


class Document(models.Model):
    CATEGORY_CHOICES = (
        ('Academics', 'Academics'),
        ('Examinations', 'Examinations'),
        ('Attendance', 'Attendance'),
        ('Fees and Finance', 'Fees and Finance'),
        ('Scholarships', 'Scholarships'),
        ('Hostel', 'Hostel'),
        ('Placements', 'Placements'),
        ('Student Services', 'Student Services'),
        ('General Policies', 'General Policies'),
        ('Personal Research', 'Personal Research'),
        ('Study Material', 'Study Material'),
        ('Technical Notes', 'Technical Notes'),
    )

    STATUS_CHOICES = (
        ('uploaded', 'Uploaded'),
        ('pending', 'Pending Ingestion'),
        ('extracting', 'Extracting Content'),
        ('chunking', 'Chunking Structure'),
        ('generating_embeddings', 'Generating Embeddings'),
        ('indexing', 'Vector Indexing'),
        ('indexed', 'Indexed & Active'),
        ('ocr_required', 'OCR Required (Scanned File)'),
        ('failed', 'Processing Failed'),
        ('archived', 'Archived / Superseded'),
    )

    VISIBILITY_CHOICES = (
        ('published', 'Published to Students'),
        ('draft', 'Draft / Under Review'),
        ('private', 'Private to Owner'),
        ('restricted', 'Administrative Restricted'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True)
    original_filename = models.CharField(max_length=255)
    stored_file = models.FileField(upload_to='documents/%Y/%m/')
    file_type = models.CharField(max_length=30, default='pdf', db_index=True)
    is_personal = models.BooleanField(default=False, db_index=True)
    collection = models.ForeignKey(
        KnowledgeCollection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents'
    )
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=60, default='General Policies', db_index=True)
    tags = models.JSONField(default=list, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    document_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='uploaded', db_index=True)
    visibility = models.CharField(max_length=30, choices=VISIBILITY_CHOICES, default='published', db_index=True)
    language = models.CharField(max_length=10, default='en')
    version = models.PositiveIntegerField(default=1)
    previous_version = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='next_versions'
    )
    checksum = models.CharField(max_length=64, blank=True, default='', db_index=True)
    file_size = models.BigIntegerField(default=0)
    page_count = models.PositiveIntegerField(default=0)
    effective_from = models.DateField(null=True, blank=True)
    effective_until = models.DateField(null=True, blank=True)
    review_date = models.DateField(null=True, blank=True)
    indexed_at = models.DateTimeField(null=True, blank=True)
    processing_error = models.TextField(blank=True, default='')
    chunk_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (v{self.version}) [{self.get_document_status_display()}]"


class DocumentChunk(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    collection = models.ForeignKey(
        KnowledgeCollection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chunks'
    )
    chunk_index = models.PositiveIntegerField(db_index=True)
    content = models.TextField()
    embedding = get_embedding_field()
    page_number = models.PositiveIntegerField(null=True, blank=True)
    page_start = models.PositiveIntegerField(null=True, blank=True)
    page_end = models.PositiveIntegerField(null=True, blank=True)
    section_title = models.CharField(max_length=255, blank=True, default='')
    token_count = models.PositiveIntegerField(default=0)
    extraction_method = models.CharField(max_length=50, default='direct_text')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['document', 'chunk_index']
        indexes = [
            models.Index(fields=['document', 'chunk_index']),
        ]

    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.document.title} (P.{self.page_number or 'N/A'})"
