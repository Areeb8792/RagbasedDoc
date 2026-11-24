import logging
import numpy as np
from typing import List, Union
from django.conf import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    def _initialize_model(self):
        model_name = getattr(settings, 'EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
        logger.info(f"Initializing EmbeddingService with model: {model_name}")
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(model_name)
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer model {model_name}: {e}. Embedding operations may fail.", exc_info=True)
            self._model = None

    @property
    def model(self):
        if self._model is None:
            self._initialize_model()
        return self._model

    def embed_text(self, text: str) -> List[float]:
        """Generates a 384-d normalized embedding vector for a single text string."""
        if not text or not text.strip():
            return [0.0] * getattr(settings, 'EMBEDDING_DIMENSION', 384)

        text = text.strip()
        if self.model:
            try:
                embedding = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
                return embedding.tolist()
            except Exception as e:
                logger.error(f"Error encoding single text: {e}")
                raise

        # Fallback pseudo-vector for uninitialized model
        logger.warning("Embedding model unavailable; generating deterministic fallback vector.")
        return self._generate_fallback_vector(text)

    def embed_documents(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Batch generates 384-d normalized embedding vectors."""
        if not texts:
            return []

        clean_texts = [t.strip() if t and t.strip() else "empty document" for t in texts]

        if self.model:
            try:
                embeddings = self.model.encode(
                    clean_texts,
                    batch_size=batch_size,
                    show_progress_bar=False,
                    convert_to_numpy=True,
                    normalize_embeddings=True
                )
                return [emb.tolist() for emb in embeddings]
            except Exception as e:
                logger.error(f"Batch embedding failed: {e}")
                raise

        return [self._generate_fallback_vector(t) for t in clean_texts]

    def _generate_fallback_vector(self, text: str) -> List[float]:
        dim = getattr(settings, 'EMBEDDING_DIMENSION', 384)
        import hashlib
        seed = int(hashlib.md5(text.encode('utf-8')).hexdigest()[:8], 16)
        rng = np.random.RandomState(seed)
        vec = rng.randn(dim)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

embedding_service = EmbeddingService()
