"""Generated Question database model."""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.assessment import Assessment
    from app.models.competency import Competency
    from app.models.learning_material import LearningMaterial
    from app.models.user import User


class GeneratedQuestion(BaseModel):
    """Generated Question model representing AI or Mock synthesized assessment questions pending trainer review."""

    __tablename__ = "generated_questions"

    learning_material_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("learning_materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("assessments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    competency_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("competencies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    question_type: Mapped[str] = mapped_column(
        String(50),
        default="MCQ",
        nullable=False,
    )
    difficulty: Mapped[str] = mapped_column(
        String(50),
        default="MEDIUM",
        nullable=False,
    )
    option_a: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    option_b: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    option_c: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    option_d: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    correct_option: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )
    explanation: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    source_reference: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    generation_status: Mapped[str] = mapped_column(
        String(50),
        default="GENERATED",
        nullable=False,
        index=True,
    )
    validation_status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
        nullable=False,
        index=True,
    )
    generation_mode: Mapped[str] = mapped_column(
        String(50),
        default="MOCK",
        nullable=False,
        index=True,
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    learning_material: Mapped["LearningMaterial"] = relationship(
        "LearningMaterial",
        back_populates="generated_questions",
    )
    competency: Mapped[Optional["Competency"]] = relationship(
        "Competency",
    )
    assessment: Mapped[Optional["Assessment"]] = relationship(
        "Assessment",
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="generated_questions",
    )
