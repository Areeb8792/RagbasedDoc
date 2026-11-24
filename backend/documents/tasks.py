import logging
from celery import shared_task
from .services.ingestion import DocumentIngestionPipeline

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_document_task(self, document_id):
    """
    Asynchronous Celery task for processing and indexing large documents.
    Enforces automatic retry on transient failures.
    """
    logger.info(f"[Celery] Received asynchronous ingestion task for document: {document_id}")
    try:
        success = DocumentIngestionPipeline.process_document(document_id)
        if not success:
            logger.warning(f"[Celery] Document {document_id} ingestion returned failure status.")
        return {'document_id': document_id, 'success': success}
    except Exception as exc:
        logger.error(f"[Celery] Error processing document {document_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc)
