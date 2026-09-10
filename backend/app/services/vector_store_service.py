"""ChromaDB Vector Store Service for RAG Knowledge Embeddings."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger("competiq.services.vector_store")

COLLECTION_NAME = "competiq_learning_materials"


class VectorStoreService:
    """Service wrapping ChromaDB persistent client for semantic chunk storage and similarity search."""

    _client = None
    _collection = None

    @classmethod
    def get_client(cls):
        """Get or initialize ChromaDB PersistentClient."""
        if cls._client is None:
            try:
                import chromadb
                persist_dir = Path(settings.CHROMA_PERSIST_DIRECTORY)
                persist_dir.mkdir(parents=True, exist_ok=True)
                cls._client = chromadb.PersistentClient(path=str(persist_dir))
                logger.info(f"Initialized ChromaDB PersistentClient at '{persist_dir}'.")
            except Exception as exc:
                logger.warning(f"ChromaDB persistent client unavailable ({exc}). Using in-memory fallback.")
                return None
        return cls._client

    @classmethod
    def get_collection(cls):
        """Get or create the standard COMPETIQ materials collection with cosine distance."""
        if cls._collection is None:
            client = cls.get_client()
            cls._collection = client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(f"ChromaDB collection '{COLLECTION_NAME}' ready.")
        return cls._collection

    @classmethod
    def add_chunks(
        cls,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ) -> int:
        """Add or update document chunks and their embeddings in ChromaDB.

        Args:
            chunks: List of chunk dictionaries with 'vector_id', 'content', and 'metadata'.
            embeddings: Corresponding list of embedding vectors.

        Returns:
            Count of vectors stored.
        """
        if not chunks or not embeddings:
            return 0

        collection = cls.get_collection()

        ids = [chunk["vector_id"] for chunk in chunks]
        documents = [chunk["content"] for chunk in chunks]
        metadatas = [
            {
                "material_id": str(chunk.get("learning_material_id", "")),
                "material_title": str(chunk.get("metadata", {}).get("material_title", "")),
                "chunk_index": int(chunk.get("chunk_index", 0)),
                "file_type": str(chunk.get("metadata", {}).get("file_type", "")),
                "topic": str(chunk.get("metadata", {}).get("topic", "")),
            }
            for chunk in chunks
        ]

        # Use upsert to prevent duplication
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

        logger.info(f"Stored {len(ids)} vectors in ChromaDB collection '{COLLECTION_NAME}'.")
        return len(ids)

    @classmethod
    def search_chunks(
        cls,
        query_embedding: List[float],
        top_k: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search ChromaDB collection for nearest neighbors using query embedding.

        Returns a list of match dictionaries with document, metadata, distance, and similarity score.
        """
        collection = cls.get_collection()
        total_count = collection.count()

        if total_count == 0:
            return []

        limit = min(top_k, total_count)

        query_params: Dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": limit,
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            query_params["where"] = where

        results = collection.query(**query_params)

        matches: List[Dict[str, Any]] = []
        if results and results.get("ids") and results["ids"][0]:
            doc_ids = results["ids"][0]
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0]

            for doc_id, doc, meta, dist in zip(doc_ids, docs, metas, distances):
                # For cosine distance, distance is in [0, 2]; similarity = max(0.0, 1.0 - dist)
                cosine_sim = max(0.0, min(1.0, 1.0 - float(dist)))
                matches.append({
                    "vector_id": doc_id,
                    "content": doc,
                    "metadata": meta,
                    "distance": float(dist),
                    "similarity": round(cosine_sim, 4),
                })

        return matches

    @classmethod
    def delete_material_chunks(cls, material_id: str) -> int:
        """Delete all chunk vectors belonging to a specific learning material."""
        collection = cls.get_collection()
        try:
            # Query IDs first to count deletions
            existing = collection.get(where={"material_id": str(material_id)})
            count = len(existing["ids"]) if existing and "ids" in existing else 0

            if count > 0:
                collection.delete(where={"material_id": str(material_id)})
                logger.info(f"Deleted {count} vectors for material '{material_id}' from ChromaDB.")
            return count
        except Exception as exc:
            logger.warning(f"Error deleting vectors for material '{material_id}': {exc}")
            return 0

    @classmethod
    def get_collection_stats(cls) -> Dict[str, Any]:
        """Retrieve total vector count and metadata summary."""
        collection = cls.get_collection()
        return {
            "collection_name": COLLECTION_NAME,
            "total_vectors": collection.count(),
            "persist_directory": str(settings.CHROMA_PERSIST_DIRECTORY),
        }
