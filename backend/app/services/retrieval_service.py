"""Semantic Retrieval Service for RAG Context Extraction."""

import difflib
import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService

logger = logging.getLogger("competiq.services.retrieval")


class RetrievalService:
    """Service retrieving, filtering, and ranking relevant document chunks for answering user questions."""

    @classmethod
    def retrieve_relevant_context(
        cls,
        query: str,
        material_id: Optional[str] = None,
        top_k: Optional[int] = None,
        min_similarity: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve top relevant document chunks matching user query, filtered by similarity threshold.

        Args:
            query: User's educational question.
            material_id: Optional restriction to a single learning material.
            top_k: Number of chunks to retrieve (defaults to settings.RAG_TOP_K).
            min_similarity: Minimum cosine similarity threshold (defaults to settings.RAG_MIN_SIMILARITY).

        Returns:
            Ranked list of relevant chunk dictionaries with content, sources, and similarity scores.
        """
        cleaned_query = (query or "").strip()
        if not cleaned_query:
            return []

        limit = top_k or settings.RAG_TOP_K
        threshold = min_similarity if min_similarity is not None else settings.RAG_MIN_SIMILARITY

        # 1. Generate query embedding
        query_vector = EmbeddingService.generate_embedding(cleaned_query)

        # 2. Query vector store
        where_clause = {"material_id": str(material_id)} if material_id else None
        matches = VectorStoreService.search_chunks(
            query_embedding=query_vector,
            top_k=limit * 2,  # Fetch extra to account for deduplication and thresholding
            where=where_clause,
        )

        if not matches:
            logger.info(f"No vector matches found in ChromaDB for query: '{cleaned_query[:60]}'")
            return []

        # 3. Filter by similarity threshold
        filtered_matches = [m for m in matches if m["similarity"] >= threshold]
        logger.info(
            f"Query '{cleaned_query[:50]}...': {len(matches)} initial matches, "
            f"{len(filtered_matches)} passed min_similarity ({threshold})."
        )

        if not filtered_matches:
            return []

        # 4. Deduplicate near-identical chunks
        deduplicated: List[Dict[str, Any]] = []
        for match in filtered_matches:
            content = match["content"].strip()
            # Check similarity against already accepted chunks
            is_dup = False
            for accepted in deduplicated:
                sim_ratio = difflib.SequenceMatcher(None, content[:200], accepted["content"][:200]).ratio()
                if sim_ratio > 0.85:
                    is_dup = True
                    break
            if not is_dup:
                deduplicated.append(match)
                if len(deduplicated) >= limit:
                    break

        # 5. Format results
        ranked_results: List[Dict[str, Any]] = []
        for item in deduplicated:
            meta = item.get("metadata", {})
            ranked_results.append({
                "content": item["content"],
                "material_id": meta.get("material_id", ""),
                "material_title": meta.get("material_title", "Educational Document"),
                "chunk_index": int(meta.get("chunk_index", 0)),
                "topic": meta.get("topic", "General"),
                "similarity_score": item["similarity"],
                "snippet": item["content"][:180].replace("\n", " ") + "...",
            })

        return ranked_results
