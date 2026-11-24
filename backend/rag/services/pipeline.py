import time
import logging
from typing import Dict, Any, List
from .retriever import retriever
from .gemini_service import gemini_service
from analytics.models import KnowledgeGap

logger = logging.getLogger(__name__)

class RAGPipeline:
    """
    Core RAG Engine Orchestrator:
    Query -> Hybrid Retrieval -> Context Building -> Grounded Generation ->
    Citation Resolution -> Knowledge Gap Recording (if unanswerable) -> Result
    """

    @classmethod
    def execute(
        cls,
        query: str,
        user=None,
        conversation_history: List[Dict[str, str]] = None,
        category_filter: str = None,
        language: str = "English",
        scope: str = "all",
        collection_id: str = None,
        document_id: str = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        username = getattr(user, 'username', 'anonymous') if user else 'anonymous'
        logger.info(f"[RAG-PIPELINE] Execution initiated: query='{query[:60]}' | user='{username}' | scope='{scope}' | col={collection_id} | doc={document_id}")

        # 1. Hybrid Retrieval with Scope Isolation
        try:
            retrieved_chunks = retriever.retrieve(
                query=query,
                user=user,
                category_filter=category_filter,
                scope=scope,
                collection_id=collection_id,
                document_id=document_id
            )
        except Exception as e:
            logger.error(f"[RAG-PIPELINE] Retrieval service failure for query '{query}': {e}", exc_info=True)
            return {
                'answer': "Retrieval service encountered an error while searching your documents. Please try again.",
                'insufficient_evidence': True,
                'evidence_status': 'retrieval_error',
                'citations': [],
                'follow_up_questions': ["Retry your inquiry"],
                'retrieved_chunks_count': 0,
                'response_time_ms': int((time.time() - start_time) * 1000),
            }

        # 2. Grounded LLM Generation or Scenario Handling
        try:
            if not retrieved_chunks:
                # Scenario A: Check if any document is still being processed
                pending_titles = retriever.get_pending_document_titles(
                    user=user, collection_id=collection_id, document_id=document_id
                )
                if pending_titles:
                    titles_str = f" ({', '.join(pending_titles)})" if pending_titles else ""
                    generation_result = {
                        'answer': f"Your document{titles_str} is still being processed. Please try again once indexing is complete.",
                        'insufficient_evidence': True,
                        'evidence_status': 'processing',
                        'cited_sources': [],
                        'follow_up_questions': [
                            "Check document status in My Documents",
                            "Retry once indexing is complete"
                        ]
                    }
                else:
                    # Scenario B: No relevant chunks found in indexed documents
                    generation_result = {
                        'answer': "I couldn't find relevant information in your uploaded documents for this question.",
                        'insufficient_evidence': True,
                        'evidence_status': 'not_found',
                        'cited_sources': [],
                        'follow_up_questions': [
                            "Can you clarify or rephrase your question?",
                            "What documents or topics are currently available in this scope?",
                            "How do I upload additional reference materials?"
                        ]
                    }
            else:
                generation_result = gemini_service.generate_grounded_answer(
                    query=query,
                    retrieved_chunks=retrieved_chunks,
                    conversation_history=conversation_history,
                    language=language
                )
        except Exception as e:
            logger.error(f"[RAG-PIPELINE] LLM generation failure for query '{query}': {e}", exc_info=True)
            return {
                'answer': "An error occurred while generating the answer. Please click retry to generate again.",
                'insufficient_evidence': True,
                'evidence_status': 'generation_error',
                'citations': [],
                'follow_up_questions': ["Retry generation"],
                'retrieved_chunks_count': len(retrieved_chunks),
                'response_time_ms': int((time.time() - start_time) * 1000),
            }

        # Ensure answer is never blank
        answer_text = (generation_result.get('answer') or '').strip()
        if not answer_text:
            if generation_result.get('insufficient_evidence'):
                answer_text = "I couldn't find relevant information in your uploaded documents for this question."
            else:
                answer_text = "No response content could be generated for this question. Please try asking again."
            generation_result['answer'] = answer_text

        insufficient_evidence = generation_result.get('insufficient_evidence', False)

        # 3. Citation Verification & Resolution
        # Map source identifiers ('source_1', 'source_2') to real database metadata
        resolved_citations = []
        if not insufficient_evidence and retrieved_chunks:
            cited_keys = generation_result.get('cited_sources', [])
            for idx, chunk_meta in enumerate(retrieved_chunks):
                source_key = f"source_{idx + 1}"
                # If model cited it or if this was the top evidence when model cited none
                if source_key in cited_keys or (not cited_keys and idx == 0):
                    resolved_citations.append({
                        'source_id': source_key,
                        'document_id': chunk_meta['document_id'],
                        'document_title': chunk_meta['document_title'],
                        'document_version': chunk_meta['document_version'],
                        'category': chunk_meta['category'],
                        'chunk_id': chunk_meta['chunk_id'],
                        'page_number': chunk_meta['page_number'],
                        'section_title': chunk_meta['section_title'],
                        'excerpt': chunk_meta['content'][:500] + ('...' if len(chunk_meta['content']) > 500 else ''),
                        'similarity': round(chunk_meta.get('similarity', 0.0), 3)
                    })

        # 4. Intelligent Knowledge Gap Detection
        if insufficient_evidence and generation_result.get('evidence_status') == 'not_found':
            try:
                gap, created = KnowledgeGap.objects.get_or_create(
                    query_text=query.strip(),
                    defaults={
                        'category': category_filter or 'General Policies',
                        'frequency': 1,
                        'status': 'new'
                    }
                )
                if not created:
                    gap.frequency += 1
                    gap.save(update_fields=['frequency', 'updated_at'])
            except Exception as e:
                logger.error(f"[RAG-PIPELINE] Failed to record knowledge gap: {e}")

        response_latency_ms = int((time.time() - start_time) * 1000)
        logger.info(f"[RAG-PIPELINE] Completed in {response_latency_ms}ms: answer_length={len(answer_text)} chars | citations={len(resolved_citations)}")

        return {
            'answer': answer_text,
            'insufficient_evidence': insufficient_evidence,
            'evidence_status': generation_result.get('evidence_status', 'fully_supported'),
            'citations': resolved_citations,
            'follow_up_questions': generation_result.get('follow_up_questions', []),
            'retrieved_chunks_count': len(retrieved_chunks),
            'response_time_ms': response_latency_ms,
        }
