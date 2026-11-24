# Technical Implementation Plan: Morpheus Personal Document Intelligence & Domain-Agnostic RAG System

**Target File:** `docs/features/document-intelligence-implementation-plan.md`  
**Date:** November 2026  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Objective

This feature implements an end-to-end **Personal Document Intelligence & Domain-Agnostic RAG System** inside the Morpheus application. It enables authenticated users (students, faculty, administrators) to upload arbitrary documents across **any subject** (e.g., Computer Science, Medicine, Mathematics, Economics, Law, Engineering, Personal Notes), organize them into **Knowledge Collections**, extract and index their contents through intelligent chunking and embeddings, and query them conversationally with strictly grounded answers and page-level citations.

---

## 2. Architecture & Reuse Audit

### Existing Components Reused:
- **Django Framework & PostgreSQL / SQLite:** SQLite local dev database with JSONField vector storage and Cosine Similarity computation fallback.
- **Embedding Infrastructure:** `SentenceTransformerEmbeddingService` using `BAAI/bge-small-en-v1.5` (384 dimensions) in `backend/rag/services/embeddings.py`.
- **Text Extractor:** `DocumentExtractor` in `backend/documents/services/extractor.py` already supporting PDF (`PyMuPDF`), Word (`python-docx`), PowerPoint (`python-pptx`), Plain Text (`.txt`), and Markdown (`.md`).
- **Text Cleaner & Chunker:** `TextCleaner` and `DocumentChunker` in `backend/documents/services/`.
- **LLM Synthesis Provider:** Google Gemini API integration in `backend/rag/services/gemini_service.py` with strict grounding and hallucination rejection rules.
- **Frontend Framework & Styling:** React 19 + Vite with Tailwind CSS v4, utilizing the approved warm editorial Morpheus design tokens (`#FBF8F5`, `#FFFDFB`, `#241D19`, `#EA7957`, `#BDD9B0`, `#35271F`).

### New & Extended Components:
1. **Knowledge Collections Model (`KnowledgeCollection`):** Groups user documents by topic/domain with metadata and ownership isolation.
2. **Document & Chunk Model Extensions:**
   - Add `collection` Foreign Key to `Document` (nullable).
   - Add `is_personal` flag to differentiate user private documents from institutional campus-wide publications.
   - Add `file_type` (`pdf`, `docx`, `pptx`, `txt`, `md`).
   - Add collection and owner tracking to `DocumentChunk`.
3. **Retrieval Isolation in `HybridRetriever`:**
   - Filter by `collection_id`, `document_id`, or `all_personal` (user documents only).
   - Enforce strict user authorization (users can never retrieve or cross-pollinate another user's private documents).
4. **Enhanced Chat / Inquiries with Document Scope:**
   - Update `Conversation` to track `collection_id` or `document_id` scope.
   - Grounded RAG prompt enforcing document evidence, page-level citations, and contradictory evidence reporting.
5. **Advanced Document Intelligence Features:**
   - Document Summarization API (Executive, Key Takeaways, Section-by-Section).
   - AI Practice Questions / Flashcard Generator derived directly from document chunks.
6. **Frontend UI Experience:**
   - New `MyDocumentsPage.jsx` route accessible at `/student/documents`.
   - Sidebar link in `StudentSidebar.jsx` labeled **"My Documents"**.
   - Elegant drag-and-drop multi-file upload zone with drag-over styling.
   - Processing status stepper (`UPLOADING`, `QUEUED`, `EXTRACTING`, `CHUNKING`, `GENERATING EMBEDDINGS`, `INDEXING`, `READY`, `FAILED`).
   - Collection Manager (Create, View, Rename, Delete, Filter).
   - Document Preview Modal (page navigation, text viewer, slide viewer).
   - Document Chat Drawer / Conversation Mode.

---

## 3. Data Models & Database Migrations

### 3.1 `KnowledgeCollection` (in `backend/documents/models.py`)
```python
class KnowledgeCollection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='knowledge_collections')
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, default='')
    color = models.CharField(max_length=20, default='#EA7957')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3.2 `Document` Extensions
- `collection`: ForeignKey to `KnowledgeCollection`, `null=True, blank=True, on_delete=models.SET_NULL, related_name='documents'`
- `is_personal`: `models.BooleanField(default=True, db_index=True)`
- `file_type`: `models.CharField(max_length=20, default='pdf')`

### 3.3 `Conversation` Extensions (in `backend/chat/models.py`)
- `collection`: ForeignKey to `KnowledgeCollection`, `null=True, blank=True, on_delete=models.SET_NULL`
- `document`: ForeignKey to `Document`, `null=True, blank=True, on_delete=models.SET_NULL`
- `scope`: `models.CharField(max_length=50, default='all_my_documents')`

---

## 4. End-to-End Ingestion & Processing Pipeline

1. **File Validation:**
   - Validate extensions: `.pdf`, `.docx`, `.doc`, `.pptx`, `.ppt`, `.txt`, `.md`.
   - Max file size check (default 25MB per file).
   - MIME type and magic header validation.
   - Compute SHA-256 checksum to prevent uncontrolled duplicate vectors.
2. **Extraction:**
   - PyMuPDF for PDF page-by-page preservation. Scanned PDF detection (sets status to `ocr_required` if text < 50 chars).
   - `python-docx` preserving headings, paragraphs, and tables.
   - `python-pptx` preserving slide numbers and titles.
   - `utf-8` text/markdown extraction.
3. **Cleaning & Chunking:**
   - Normalizing whitespace, retaining paragraph boundaries and page numbers.
   - Target chunk: 400-600 tokens (~1600 characters) with 80-token overlap.
4. **Vector Embedding:**
   - `BAAI/bge-small-en-v1.5` producing 384-dim normalized embeddings.
   - Persisting embeddings and metadata into `DocumentChunk`.
5. **Indexing Status Updates:**
   - Transition states: `uploaded` → `processing` → `indexed` (or `failed` / `ocr_required`).

---

## 5. Retrieval & RAG Question-Answering

1. **Isolation & Scoping:**
   - When `collection_id` is supplied: Query only documents belonging to that collection owned by `request.user`.
   - When `document_id` is supplied: Query only chunks belonging to that specific document.
   - When `all_personal` is supplied: Query all personal documents owned by `request.user`.
   - When no personal scope is provided: Query institutional published documents.
2. **Prompt Grounding:**
   - Strict citation IDs (`source_1`, `source_2`).
   - Explicit hallucination rejection when documents do not contain answers.
   - Contradiction detection across multiple documents.
3. **Citation Verification:**
   - Verify every cited chunk against retrieved chunks before returning to client.

---

## 6. Frontend Components to Implement

1. **`MyDocumentsPage.jsx` (`/student/documents`):**
   - Collection tabs & Collection Creator dialog.
   - Drag-and-drop upload zone with multi-file queue and real progress status.
   - Document table/cards with status badges, chunk counts, page counts, actions.
   - Document Preview Modal.
   - Document Summarizer Modal.
   - Generate Study Material Modal (practice questions / key concepts).
2. **`StudentSidebar.jsx` & Router:**
   - Add navigation item `My Documents` (`/student/documents`).
   - Register route in `App.jsx`.
3. **`ChatPage.jsx` Scope Selector:**
   - Add knowledge scope dropdown allowing the student to toggle between "Institutional Knowledge", "All My Documents", or a specific Knowledge Collection.
   - Display active scope banner above the conversation.

---

## 7. Testing & Quality Verification Plan

- Unit tests for `KnowledgeCollection` CRUD and document assignment.
- Tests for file validation, extraction, chunking, and embedding.
- Tests for retrieval isolation (verifying User A cannot retrieve User B's documents).
- Tests for RAG answers with citations and summaries.
- Browser visual QA verifying responsiveness and Morpheus design system fidelity.
