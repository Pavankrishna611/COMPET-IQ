"""Embedding Service utilizing Sentence Transformers."""

import hashlib
import logging
import math
import re
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger("competiq.services.embedding")

# Module-level singleton cache
_MODEL_INSTANCE = None
_MODEL_LOAD_FAILED = False
EMBEDDING_DIMENSION = 384


class EmbeddingService:
    """Service providing vector embeddings with lazy singleton loading and offline fallback."""

    @classmethod
    def get_embedding_model(cls):
        """Retrieve or lazily initialize the SentenceTransformer embedding model."""
        global _MODEL_INSTANCE, _MODEL_LOAD_FAILED

        if _MODEL_INSTANCE is not None:
            return _MODEL_INSTANCE

        if _MODEL_LOAD_FAILED:
            return None

        try:
            from sentence_transformers import SentenceTransformer

            model_name = settings.EMBEDDING_MODEL or "sentence-transformers/all-MiniLM-L6-v2"
            logger.info(f"Loading SentenceTransformer model '{model_name}'...")
            _MODEL_INSTANCE = SentenceTransformer(model_name)
            logger.info(f"Successfully loaded embedding model '{model_name}'.")
            return _MODEL_INSTANCE
        except Exception as exc:
            logger.warning(
                f"Could not load SentenceTransformer model ({exc}). "
                "Falling back to deterministic semantic hash embeddings for offline/testing operation."
            )
            _MODEL_LOAD_FAILED = True
            return None

    @classmethod
    def _fallback_embedding(cls, text: str) -> List[float]:
        """Deterministic 384-dimensional pseudo-semantic vector generator for offline/fallback mode.

        Constructs normalized 384-dim vector using token hash distribution and term frequency.
        """
        words = re.findall(r"\b[A-Za-z0-9_]{2,}\b", text.lower())
        vec = [0.0] * EMBEDDING_DIMENSION

        if not words:
            return vec

        for word in words:
            # Map word to dimensions via multiple hash salts
            h1 = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16) % EMBEDDING_DIMENSION
            h2 = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16) % EMBEDDING_DIMENSION
            h3 = (h1 + h2 * 31) % EMBEDDING_DIMENSION

            vec[h1] += 1.0
            vec[h2] += 0.5
            vec[h3] += 0.25

        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]

        return vec

    @classmethod
    def generate_embedding(cls, text: str) -> List[float]:
        """Generate a normalized 384-dimensional embedding vector for a single text."""
        cleaned = (text or "").strip()
        if not cleaned:
            return [0.0] * EMBEDDING_DIMENSION

        model = cls.get_embedding_model()
        if model is not None:
            try:
                embedding = model.encode(cleaned, normalize_embeddings=True)
                return [float(x) for x in embedding]
            except Exception as exc:
                logger.error(f"Error during SentenceTransformer encoding: {exc}")
                return cls._fallback_embedding(cleaned)

        return cls._fallback_embedding(cleaned)

    @classmethod
    def generate_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for a batch of text strings."""
        if not texts:
            return []

        cleaned_texts = [(t or "").strip() for t in texts]
        model = cls.get_embedding_model()

        if model is not None:
            try:
                embeddings = model.encode(cleaned_texts, normalize_embeddings=True, batch_size=32)
                return [[float(x) for x in row] for row in embeddings]
            except Exception as exc:
                logger.error(f"Error during batch SentenceTransformer encoding: {exc}")
                return [cls._fallback_embedding(t) for t in cleaned_texts]

        return [cls._fallback_embedding(t) for t in cleaned_texts]
