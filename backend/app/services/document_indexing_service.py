"""Document Indexing Service orchestrating chunking, vector embedding, and ChromaDB persistence."""

import logging
import uuid
from typing import Any, Dict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.models.learning_material import LearningMaterial
from app.services.chunking_service import ChunkingService
from app.services.content_analysis_service import ContentAnalysisService
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import COLLECTION_NAME, VectorStoreService

logger = logging.getLogger("competiq.services.document_indexing")


class DocumentIndexingService:
    """Service handling the end-to-end knowledge indexing pipeline for approved learning materials."""

    @classmethod
    def approve_learning_material(
        cls,
        db: Session,
        material_id: uuid.UUID,
    ) -> LearningMaterial:
        """Mark a processed learning material as approved for knowledge base inclusion."""
        material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Learning material '{material_id}' not found.",
            )

        if material.status != "PROCESSED" or not material.extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only learning materials in PROCESSED status with extracted text can be approved.",
            )

        material.is_approved = True
        db.commit()
        db.refresh(material)
        logger.info(f"Approved learning material '{material.title}' ({material.id}) for knowledge indexing.")
        return material

    @classmethod
    def index_learning_material(
        cls,
        db: Session,
        material_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """Chunk, embed, and store vectors in ChromaDB and document_chunks in database.

        Requires material to be PROCESSED and is_approved == True.
        """
        material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Learning material '{material_id}' not found.",
            )

        if material.status != "PROCESSED" or not material.extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Learning material '{material_id}' is not in PROCESSED status or contains no extracted text.",
            )

        if not material.is_approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Learning material '{material.title}' must be approved before indexing into the vector store.",
            )

        # 1. Clean previous chunks for this material (idempotent re-indexing)
        VectorStoreService.delete_material_chunks(str(material.id))
        db.query(DocumentChunk).filter(DocumentChunk.learning_material_id == material.id).delete()
        db.commit()

        # 2. Extract detected topic
        topics = ContentAnalysisService.identify_topics(material.extracted_text, top_n=1)
        primary_topic = topics[0] if topics else "General Education"

        # 3. Semantic chunking
        chunks = ChunkingService.chunk_document_text(
            text=material.extracted_text,
            material_id=material.id,
            material_title=material.title,
            file_type=material.file_type,
            topic=primary_topic,
            chunk_size=1000,
            chunk_overlap=150,
        )

        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No usable chunks could be generated from the document text.",
            )

        # 4. Generate embeddings
        chunk_texts = [c["content"] for c in chunks]
        embeddings = EmbeddingService.generate_embeddings(chunk_texts)

        # 5. Persist vectors in ChromaDB
        vectors_stored = VectorStoreService.add_chunks(chunks=chunks, embeddings=embeddings)

        # 6. Persist DocumentChunk records in relational database
        for c in chunks:
            doc_chunk = DocumentChunk(
                learning_material_id=material.id,
                chunk_index=c["chunk_index"],
                content=c["content"],
                token_count=c["token_count"],
                metadata_json=c["metadata_json"],
                vector_id=c["vector_id"],
            )
            db.add(doc_chunk)

        db.commit()

        logger.info(
            f"Successfully indexed '{material.title}' ({material.id}): "
            f"{len(chunks)} chunks created, {vectors_stored} vectors stored in ChromaDB."
        )

        return {
            "material_id": material.id,
            "material_title": material.title,
            "chunks_created": len(chunks),
            "vectors_stored": vectors_stored,
            "status": "INDEXED",
            "collection_name": COLLECTION_NAME,
        }

    @classmethod
    def get_index_status(
        cls,
        db: Session,
        material_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """Check indexing status and chunk count for a material."""
        material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Learning material '{material_id}' not found.",
            )

        chunk_count = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.learning_material_id == material.id)
            .count()
        )

        return {
            "material_id": material.id,
            "title": material.title,
            "status": material.status,
            "is_approved": material.is_approved,
            "is_indexed": chunk_count > 0,
            "chunk_count": chunk_count,
            "vector_count": chunk_count,
        }
