"""Document Chunking Service for RAG Knowledge Ingestion."""

import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

logger = logging.getLogger("competiq.services.chunking")


class ChunkingService:
    """Service providing semantic, paragraph-aware text chunking with configurable overlap."""

    @classmethod
    def chunk_document_text(
        cls,
        text: str,
        material_id: uuid.UUID,
        material_title: str,
        file_type: str,
        topic: Optional[str] = None,
        chunk_size: int = 1000,
        chunk_overlap: int = 150,
    ) -> List[Dict[str, Any]]:
        """Split document text into cohesive semantic chunks preserving paragraph and sentence boundaries.

        Args:
            text: Raw or normalized document text.
            material_id: UUID of parent LearningMaterial.
            material_title: Human-readable title of document.
            file_type: Extension or type of document (pdf, docx, etc.).
            topic: Primary topic associated with document if available.
            chunk_size: Target maximum characters per chunk (default: 1000, range: 800-1200).
            chunk_overlap: Character overlap between consecutive chunks (default: 150, range: 100-250).

        Returns:
            List of chunk dictionaries with content, index, and metadata.
        """
        if not text or not text.strip():
            return []

        # 1. Split into paragraphs
        raw_paragraphs = re.split(r"\n\s*\n", text)
        paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]

        if not paragraphs:
            return []

        chunks: List[str] = []
        current_chunk = ""

        for para in paragraphs:
            # If a single paragraph is larger than chunk_size, split by sentences
            if len(para) > chunk_size:
                sentences = re.split(r"(?<=[.!?])\s+", para)
                for sent in sentences:
                    sent = sent.strip()
                    if not sent:
                        continue
                    if len(current_chunk) + len(sent) + 1 <= chunk_size:
                        current_chunk = f"{current_chunk} {sent}".strip() if current_chunk else sent
                    else:
                        if current_chunk:
                            chunks.append(current_chunk)
                            # Apply overlap from the tail of current_chunk
                            overlap_text = current_chunk[-chunk_overlap:].strip() if len(current_chunk) > chunk_overlap else current_chunk
                            current_chunk = f"{overlap_text} {sent}".strip()
                        else:
                            # Sentence itself is longer than chunk_size
                            chunks.append(sent[:chunk_size])
                            current_chunk = sent[chunk_size - chunk_overlap:].strip()
            else:
                # Normal paragraph fits or accumulates
                if len(current_chunk) + len(para) + 2 <= chunk_size:
                    current_chunk = f"{current_chunk}\n\n{para}".strip() if current_chunk else para
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                        overlap_text = current_chunk[-chunk_overlap:].strip() if len(current_chunk) > chunk_overlap else current_chunk
                        current_chunk = f"{overlap_text}\n\n{para}".strip()
                    else:
                        current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        # 2. Build structured metadata dictionaries
        result_chunks: List[Dict[str, Any]] = []
        clean_type = file_type.lower().lstrip(".")
        assigned_topic = topic or "General Education"

        for idx, chunk_content in enumerate(chunks):
            # Estimate tokens (~4 characters per token for English text)
            token_est = max(1, len(chunk_content) // 4)
            vector_id = f"{material_id}_chunk_{idx}"

            meta = {
                "material_id": str(material_id),
                "material_title": material_title,
                "chunk_index": idx,
                "file_type": clean_type,
                "topic": assigned_topic,
                "char_length": len(chunk_content),
                "token_estimate": token_est,
            }

            result_chunks.append({
                "learning_material_id": material_id,
                "chunk_index": idx,
                "content": chunk_content,
                "token_count": token_est,
                "metadata_json": json.dumps(meta),
                "vector_id": vector_id,
                "metadata": meta,
            })

        logger.info(
            f"Chunked document '{material_title}' ({material_id}) into {len(result_chunks)} "
            f"chunks (target size: {chunk_size}, overlap: {chunk_overlap})"
        )
        return result_chunks
