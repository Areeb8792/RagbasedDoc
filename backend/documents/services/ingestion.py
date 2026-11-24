import os
import time
import logging
from pathlib import Path
from django.utils import timezone
from documents.models import Document, DocumentChunk
from .extractor import DocumentExtractor
from .cleaner import TextCleaner
from .chunker import DocumentChunker
from rag.services.embeddings import embedding_service
from audit.services import log_audit_event

logger = logging.getLogger(__name__)

class DocumentIngestionPipeline:
    """
    Complete end-to-end document ingestion pipeline:
    Validate -> Extract -> Clean -> Chunk -> Embed -> Persist in pgvector/DB -> Mark Indexed
    With real processing states:
    uploaded -> extracting -> chunking -> generating_embeddings -> indexing -> indexed (or ocr_required / failed)
    """

    @classmethod
    def process_document(cls, document_id: str) -> bool:
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            logger.error(f"Document {document_id} not found for ingestion.")
            return False

        logger.info(f"Starting ingestion for document: {document.title} (ID: {document.id})")
        start_time = time.time()

        document.document_status = 'extracting'
        document.processing_error = ''
        document.save(update_fields=['document_status', 'processing_error'])

        temp_path = None
        try:
            # Resolve file path safely for both local/mounted disks and remote storage (S3/Cloudflare R2)
            file_path = None
            try:
                if hasattr(document.stored_file, 'path') and os.path.exists(document.stored_file.path):
                    file_path = document.stored_file.path
            except (NotImplementedError, AttributeError, Exception):
                file_path = None

            if not file_path:
                # Remote storage or stream: buffer into a temporary file for PyMuPDF/docx/pptx extraction
                import tempfile
                ext_suffix = Path(document.original_filename or 'document').suffix
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext_suffix) as tmp:
                    for chunk in document.stored_file.chunks():
                        tmp.write(chunk)
                    temp_path = tmp.name
                    file_path = temp_path

            # Derive file_type if empty
            ext = Path(document.original_filename or file_path).suffix.lower().replace('.', '')
            if not document.file_type or document.file_type != ext:
                document.file_type = ext or 'pdf'

            # 1. Extraction
            raw_units = DocumentExtractor.extract(file_path, document.original_filename)
            if not raw_units:
                raise ValueError("No extractable content could be retrieved from this document.")

            # Check if document is scanned with zero selectable text
            is_scanned = any(u.get('metadata', {}).get('scanned', False) for u in raw_units)
            total_text_len = sum(len(u.get('content', '')) for u in raw_units)
            if is_scanned or total_text_len < 40:
                document.document_status = 'ocr_required'
                document.processing_error = 'Scanned file detected with no selectable text. OCR engine required for text extraction.'
                document.page_count = len(raw_units)
                document.save(update_fields=['document_status', 'processing_error', 'page_count', 'file_type'])
                return False

            # Compute page count
            pages_found = set()
            for u in raw_units:
                if u.get('page_number'):
                    pages_found.add(u.get('page_number'))
            document.page_count = len(pages_found) or len(raw_units)

            # 2. Cleaning
            cleaned_units = []
            for unit in raw_units:
                cleaned_text = TextCleaner.clean(unit.get('content', ''))
                if cleaned_text:
                    unit_copy = dict(unit)
                    unit_copy['content'] = cleaned_text
                    cleaned_units.append(unit_copy)

            if not cleaned_units:
                raise ValueError("Document contained no readable text after cleaning.")

            # 3. Chunking
            document.document_status = 'chunking'
            document.save(update_fields=['document_status'])

            chunker = DocumentChunker()
            chunk_dicts = chunker.chunk_extracted_units(cleaned_units)
            if not chunk_dicts:
                raise ValueError("No semantic chunks could be generated from document content.")

            # 4. Generate Embeddings
            document.document_status = 'generating_embeddings'
            document.save(update_fields=['document_status'])

            chunk_texts = [c['content'] for c in chunk_dicts]
            embeddings = embedding_service.embed_documents(chunk_texts)

            # 5. Database Persistence (Delete old chunks first to avoid duplicates)
            document.document_status = 'indexing'
            document.save(update_fields=['document_status'])

            DocumentChunk.objects.filter(document=document).delete()

            chunk_instances = []
            for idx, c in enumerate(chunk_dicts):
                chunk_instances.append(DocumentChunk(
                    document=document,
                    collection=document.collection,
                    chunk_index=c['chunk_index'],
                    content=c['content'],
                    embedding=embeddings[idx],
                    page_number=c.get('page_number'),
                    page_start=c.get('page_start'),
                    page_end=c.get('page_end'),
                    section_title=c.get('section_title', '')[:255],
                    token_count=c.get('token_count', 0),
                    extraction_method=c.get('extraction_method', 'direct_text'),
                    metadata=c.get('metadata', {})
                ))

            DocumentChunk.objects.bulk_create(chunk_instances)

            # 6. Mark Document as Indexed
            document.document_status = 'indexed'
            document.chunk_count = len(chunk_instances)
            document.indexed_at = timezone.now()
            document.processing_error = ''
            document.save(update_fields=['document_status', 'chunk_count', 'indexed_at', 'processing_error', 'page_count', 'file_type'])

            duration = round(time.time() - start_time, 2)
            logger.info(f"Successfully indexed document {document.title}: {len(chunk_instances)} chunks in {duration}s")

            log_audit_event(
                actor=document.uploaded_by,
                action='document_indexed',
                target_type='Document',
                target_id=str(document.id),
                metadata={'title': document.title, 'chunk_count': len(chunk_instances), 'duration_seconds': duration}
            )
            return True

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to ingest document {document.id}: {error_msg}", exc_info=True)
            document.document_status = 'failed'
            document.processing_error = error_msg
            document.save(update_fields=['document_status', 'processing_error', 'file_type'])

            log_audit_event(
                actor=document.uploaded_by,
                action='document_indexing_failed',
                target_type='Document',
                target_id=str(document.id),
                metadata={'error': error_msg}
            )
            return False
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    @classmethod
    def trigger_ingestion(cls, document_id, async_mode=None):
        """
        Dispatches document processing.
        If Celery broker is configured and async processing is appropriate,
        offloads to Celery task; otherwise runs synchronously in-process.
        """
        from django.conf import settings
        broker = getattr(settings, 'CELERY_BROKER_URL', '')
        if broker and (async_mode is True or async_mode is None):
            try:
                from documents.tasks import process_document_task
                task = process_document_task.delay(str(document_id))
                logger.info(f"Dispatched document {document_id} ingestion to Celery task: {task.id}")
                return True
            except Exception as e:
                logger.warning(f"Celery dispatch failed ({e}), falling back to synchronous execution.")
        return cls.process_document(document_id)
