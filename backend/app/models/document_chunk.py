"""Document Chunk database model for RAG retrieval."""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.learning_material import LearningMaterial


class DocumentChunk(BaseModel):
    """Document Chunk model representing an indexed text segment stored in ChromaDB."""

    __tablename__ = "document_chunks"
    __table_args__ = (
        UniqueConstraint("learning_material_id", "chunk_index", name="uq_document_chunk_material_index"),
    )

    learning_material_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("learning_materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    token_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    metadata_json: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    vector_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # Relationships
    learning_material: Mapped["LearningMaterial"] = relationship(
        "LearningMaterial",
        back_populates="document_chunks",
    )
