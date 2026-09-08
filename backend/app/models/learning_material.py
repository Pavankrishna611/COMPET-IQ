"""Learning Material database model."""

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.document_chunk import DocumentChunk
    from app.models.generated_question import GeneratedQuestion
    from app.models.user import User


class LearningMaterial(BaseModel):
    """Learning Material model representing uploaded educational resources (PDF, DOCX, PPTX, TXT)."""

    __tablename__ = "learning_materials"

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    stored_filename: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    file_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="UPLOADED",
        nullable=False,
        index=True,
    )
    is_approved: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    extracted_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    extraction_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    uploader: Mapped["User"] = relationship(
        "User",
        back_populates="learning_materials",
    )
    generated_questions: Mapped[List["GeneratedQuestion"]] = relationship(
        "GeneratedQuestion",
        back_populates="learning_material",
        cascade="all, delete-orphan",
    )
    document_chunks: Mapped[List["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates="learning_material",
        cascade="all, delete-orphan",
    )
