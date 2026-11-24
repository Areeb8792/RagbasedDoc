# Database Schema & Entity Relationships

The G38 platform uses PostgreSQL with the `pgvector` extension for storing relational data and 384-dimensional dense vectors.

---

## 1. Core Models

### `accounts.User`
- `id` (UUID, PK)
- `username` (CharField, unique)
- `email` (EmailField, unique, indexed)
- `password` (CharField, Django hashed)
- `role` (CharField: 'student', 'admin', 'superadmin')
- `department` (CharField)
- `student_id` (CharField)
- `preferred_language` (CharField: 'en', 'hi', 'pa')
- `theme_preference` (CharField: 'light', 'dark', 'system')
- `interests` (JSONField: e.g. ['Academics', 'Examinations'])
- `is_active` (BooleanField, default=True)
- `date_joined`, `last_login`

### `documents.Document`
- `id` (UUID, PK)
- `title` (CharField, indexed)
- `original_filename` (CharField)
- `stored_file` (FileField: `documents/%Y/%m/`)
- `description` (TextField)
- `category` (CharField: 'Academics', 'Examinations', 'Attendance', 'Fees and Finance', 'Scholarships', 'Hostel', 'Placements', 'Student Services', 'General Policies')
- `tags` (JSONField)
- `uploaded_by` (FK -> User)
- `document_status` (CharField: 'uploaded', 'processing', 'indexed', 'failed', 'archived')
- `visibility` (CharField: 'published', 'draft', 'restricted')
- `language` (CharField: 'en')
- `version` (PositiveIntegerField, default=1)
- `previous_version` (FK -> Document, self-referential)
- `checksum` (CharField: SHA-256)
- `file_size` (BigIntegerField)
- `effective_from`, `effective_until`, `review_date` (DateFields)
- `indexed_at` (DateTimeField)
- `chunk_count` (PositiveIntegerField)
- `processing_error` (TextField)

### `documents.DocumentChunk`
- `id` (UUID, PK)
- `document` (FK -> Document, CASCADE)
- `chunk_index` (PositiveIntegerField)
- `content` (TextField)
- `embedding` (VectorField(384) in PostgreSQL / JSONField in SQLite)
- `page_number`, `page_start`, `page_end` (PositiveIntegerFields)
- `section_title` (CharField)
- `token_count` (PositiveIntegerField)
- `extraction_method` (CharField: 'pymupdf_pdf', 'docx_structure', 'pptx_slide', 'plain_text')
- `metadata` (JSONField)

### `chat.Conversation`
- `id` (UUID, PK)
- `user` (FK -> User, CASCADE)
- `title` (CharField)
- `archived` (BooleanField)
- `created_at`, `updated_at`

### `chat.Message`
- `id` (UUID, PK)
- `conversation` (FK -> Conversation, CASCADE)
- `role` (CharField: 'user', 'assistant')
- `content` (TextField)
- `response_status` (CharField: 'success', 'insufficient_evidence', 'error')
- `insufficient_evidence` (BooleanField)
- `model_identifier` (CharField)
- `response_time_ms` (PositiveIntegerField)
- `follow_up_suggestions` (JSONField)
- `created_at`

### `chat.MessageCitation`
- `id` (UUID, PK)
- `message` (FK -> Message, CASCADE)
- `document` (FK -> Document, CASCADE)
- `document_chunk` (FK -> DocumentChunk, SET_NULL)
- `citation_order` (PositiveIntegerField)
- `page_number` (PositiveIntegerField)
- `section_title` (CharField)
- `excerpt` (TextField)
- `similarity_score` (FloatField)

### `chat.SavedAnswer`
- `id` (UUID, PK)
- `user` (FK -> User, CASCADE)
- `message` (FK -> Message, CASCADE)
- `note` (TextField)
- UniqueConstraint on `(user, message)`

### `analytics.KnowledgeGap`
- `id` (UUID, PK)
- `query_text` (CharField, unique, indexed)
- `category` (CharField)
- `frequency` (PositiveIntegerField)
- `status` (CharField: 'new', 'under_review', 'resolved', 'dismissed')
- `resolution_notes` (TextField)

### `feedback.Feedback`
- `id` (UUID, PK)
- `user` (FK -> User, SET_NULL)
- `message` (FK -> Message, CASCADE)
- `rating` (CharField: 'helpful', 'not_helpful', 'incorrect', 'unsupported')
- `issue_type` (CharField: 'none', 'factual_error', 'outdated_policy', 'missing_context', 'wrong_citation', 'other')
- `comment` (TextField)
- `status` (CharField: 'new', 'under_review', 'resolved', 'dismissed')
- `admin_notes` (TextField)

### `faqs.FAQ`
- `id` (UUID, PK)
- `question` (CharField)
- `answer` (TextField)
- `category` (CharField)
- `visibility` (CharField: 'published', 'draft')
- `order` (PositiveIntegerField)
- `created_by` (FK -> User)

### `audit.AuditLog`
- `id` (UUID, PK)
- `actor` (FK -> User, SET_NULL)
- `actor_email` (CharField)
- `action` (CharField)
- `target_type`, `target_id` (CharFields)
- `metadata` (JSONField)
- `ip_address` (GenericIPAddressField)
- `timestamp` (DateTimeField)
