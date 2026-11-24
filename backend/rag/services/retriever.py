import logging
import numpy as np
from datetime import date
from typing import List, Dict, Any
from django.conf import settings
from django.db.models import Q
from documents.models import Document, DocumentChunk
from .embeddings import embedding_service

logger = logging.getLogger(__name__)

class HybridRetriever:
    """
    Combines dense semantic vector retrieval (pgvector / cosine similarity)
    with sparse lexical keyword search using Reciprocal Rank Fusion (RRF).
    Enforces document visibility, freshness, and status constraints.
    """

    def __init__(self, top_k: int = None, min_similarity: float = None):
        self.top_k = top_k or getattr(settings, 'RAG_TOP_K', 5)
        self.min_similarity = min_similarity or getattr(settings, 'RAG_SIMILARITY_THRESHOLD', 0.28)

    def get_pending_document_titles(
        self,
        user=None,
        collection_id: str = None,
        document_id: str = None
    ) -> List[str]:
        """
        Checks if there are documents currently in a non-terminal processing state
        for this user and active retrieval scope.
        """
        if not user or not user.is_authenticated:
            return []

        pending_statuses = [
            'uploaded', 'pending', 'extracting', 'chunking',
            'generating_embeddings', 'indexing'
        ]
        qs = Document.objects.filter(
            uploaded_by=user,
            document_status__in=pending_statuses
        )
        if document_id:
            qs = qs.filter(id=document_id)
        elif collection_id:
            qs = qs.filter(collection_id=collection_id)

        return list(qs.values_list('title', flat=True)[:5])

    def retrieve(
        self,
        query: str,
        user=None,
        category_filter: str = None,
        scope: str = 'all',
        collection_id: str = None,
        document_id: str = None
    ) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return []

        logger.info(f"[RAG-RETRIEVER] Query: '{query[:60]}' | User: {user} | Scope: {scope} | Collection: {collection_id} | Document: {document_id}")

        # 1. Base Document Queryset with strict access and isolation rules
        today = date.today()
        base_qs = Document.objects.filter(
            document_status='indexed'
        ).exclude(document_status='archived').filter(
            Q(effective_until__isnull=True) | Q(effective_until__gte=today)
        )

        if document_id:
            # Query strictly isolated to a single document
            if user and user.is_authenticated:
                doc_qs = base_qs.filter(id=document_id).filter(
                    Q(visibility='published') | Q(uploaded_by=user)
                )
            else:
                doc_qs = base_qs.filter(id=document_id, visibility='published')
        elif collection_id:
            # Strict collection isolation: only retrieve chunks from this collection
            if user and user.is_authenticated:
                doc_qs = base_qs.filter(
                    is_personal=True,
                    collection_id=collection_id,
                    uploaded_by=user
                )
            else:
                doc_qs = Document.objects.none()
        elif scope == 'personal_all':
            # Retrieve from all personal documents of the user
            if user and user.is_authenticated:
                doc_qs = base_qs.filter(
                    is_personal=True,
                    uploaded_by=user
                )
            else:
                doc_qs = Document.objects.none()
        elif scope == 'institutional':
            # Retrieve strictly from official published institutional documents
            doc_qs = base_qs.filter(visibility='published', is_personal=False)
        else:
            # Hybrid / All accessible documents (institutional + user's personal documents)
            if user and user.is_authenticated:
                doc_qs = base_qs.filter(
                    Q(visibility='published') | Q(is_personal=True, uploaded_by=user)
                )
            else:
                doc_qs = base_qs.filter(visibility='published')

        if category_filter:
            doc_qs = doc_qs.filter(category=category_filter)

        valid_doc_ids = set(doc_qs.values_list('id', flat=True))
        accessible_count = len(valid_doc_ids)
        logger.info(f"[RAG-RETRIEVER] Accessible indexed documents matching scope: {accessible_count}")

        if not valid_doc_ids:
            logger.info(f"[RAG-RETRIEVER] No active indexed documents found for retrieval.")
            return []

        # 2. Vector Semantic Search
        vector_results = self._dense_vector_search(query, valid_doc_ids)

        # 3. Keyword Lexical Search
        keyword_results = self._sparse_keyword_search(query, valid_doc_ids)

        # 4. Reciprocal Rank Fusion (RRF)
        fused_chunks = self._reciprocal_rank_fusion(vector_results, keyword_results)

        # 5. Filter by minimum similarity and limit to top_k
        final_results = []
        for item in fused_chunks[:self.top_k]:
            if item.get('similarity', 1.0) >= self.min_similarity or item.get('keyword_match', False):
                final_results.append(item)

        top_doc_names = list(dict.fromkeys([item.get('document_title', 'Unknown') for item in final_results]))
        logger.info(f"[RAG-RETRIEVER] Retrieved {len(final_results)} relevant chunks across documents: {top_doc_names}")

        return final_results

    def _dense_vector_search(self, query: str, valid_doc_ids: set) -> List[Dict[str, Any]]:
        query_vec = embedding_service.embed_text(query)
        if not query_vec:
            return []

        query_vec_np = np.array(query_vec, dtype=np.float32)

        # If PostgreSQL with pgvector is enabled in database settings:
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
            try:
                from pgvector.django import CosineDistance
                chunks = DocumentChunk.objects.filter(
                    document_id__in=valid_doc_ids
                ).annotate(
                    distance=CosineDistance('embedding', query_vec)
                ).order_by('distance')[:self.top_k * 2]

                results = []
                for chunk in chunks:
                    sim = 1.0 - getattr(chunk, 'distance', 1.0)
                    results.append({
                        'chunk': chunk,
                        'similarity': float(sim),
                        'score_type': 'vector'
                    })
                return results
            except Exception as e:
                logger.warning(f"pgvector query fallback to python similarity: {e}")

        # Python / Numpy Cosine Similarity computation
        chunks = list(DocumentChunk.objects.filter(
            document_id__in=valid_doc_ids
        ).select_related('document'))

        if not chunks:
            return []

        scored_chunks = []
        for chunk in chunks:
            emb = chunk.embedding
            if not emb:
                continue
            emb_np = np.array(emb, dtype=np.float32)
            norm = np.linalg.norm(emb_np)
            if norm > 0:
                emb_norm = emb_np / norm
                sim = float(np.dot(query_vec_np, emb_norm))
                scored_chunks.append({
                    'chunk': chunk,
                    'similarity': sim,
                    'score_type': 'vector'
                })

        scored_chunks.sort(key=lambda x: x['similarity'], reverse=True)
        return scored_chunks[:self.top_k * 2]

    def _sparse_keyword_search(self, query: str, valid_doc_ids: set) -> List[Dict[str, Any]]:
        stop_words = {
            'what', 'when', 'where', 'which', 'who', 'whom', 'how', 'why',
            'this', 'that', 'these', 'those', 'the', 'and', 'but', 'for',
            'with', 'about', 'from', 'into', 'during', 'before', 'after',
            'above', 'below', 'to', 'in', 'out', 'on', 'off', 'over', 'under',
            'can', 'will', 'should', 'would', 'could', 'are', 'is', 'was', 'were'
        }
        keywords = [k.strip().lower() for k in query.split() if len(k.strip()) > 2 and k.strip().lower() not in stop_words]
        if not keywords:
            return []

        query_filter = Q()
        for kw in keywords[:5]:  # limit to top 5 prominent terms
            query_filter |= Q(content__icontains=kw) | Q(document__title__icontains=kw)

        chunks = DocumentChunk.objects.filter(
            document_id__in=valid_doc_ids
        ).filter(query_filter).select_related('document')[:self.top_k * 2]

        results = []
        for chunk in chunks:
            content_lower = chunk.content.lower()
            match_count = sum(content_lower.count(kw) for kw in keywords)
            if match_count > 0:
                results.append({
                    'chunk': chunk,
                    'keyword_score': match_count,
                    'score_type': 'keyword'
                })

        results.sort(key=lambda x: x.get('keyword_score', 0), reverse=True)
        return results

    def _reciprocal_rank_fusion(self, vector_results: List[Dict], keyword_results: List[Dict], k: int = 60) -> List[Dict[str, Any]]:
        rrf_scores = {}
        chunk_map = {}
        sim_map = {}
        keyword_flags = {}

        for rank, item in enumerate(vector_results):
            chunk = item['chunk']
            chunk_id = chunk.id
            chunk_map[chunk_id] = chunk
            sim_map[chunk_id] = item.get('similarity', 0.0)
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (k + rank + 1))

        for rank, item in enumerate(keyword_results):
            chunk = item['chunk']
            chunk_id = chunk.id
            chunk_map[chunk_id] = chunk
            keyword_flags[chunk_id] = True
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (k + rank + 1))

        ranked_items = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        merged = []
        for chunk_id, rrf_score in ranked_items:
            chunk = chunk_map[chunk_id]
            merged.append({
                'chunk_id': str(chunk.id),
                'document_id': str(chunk.document.id),
                'document_title': chunk.document.title,
                'document_version': chunk.document.version,
                'category': chunk.document.category,
                'content': chunk.content,
                'page_number': chunk.page_number,
                'section_title': chunk.section_title,
                'similarity': sim_map.get(chunk_id, 0.0),
                'rrf_score': rrf_score,
                'keyword_match': keyword_flags.get(chunk_id, False)
            })

        return merged

retriever = HybridRetriever()
