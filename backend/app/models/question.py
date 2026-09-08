"""Question model definition."""

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.assessment import Assessment
    from app.models.competency import Competency
    from app.models.question_attempt import QuestionAttempt


class Question(BaseModel):
    """Question model representing an item in an assessment with competency attribution."""

    __tablename__ = "questions"

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
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
    points: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )
    sequence_order: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    # Relationships
    assessment: Mapped["Assessment"] = relationship(
        "Assessment",
        back_populates="questions",
    )
    competency: Mapped[Optional["Competency"]] = relationship(
        "Competency",
        back_populates="questions",
    )
    question_attempts: Mapped[List["QuestionAttempt"]] = relationship(
        "QuestionAttempt",
        back_populates="question",
        cascade="all, delete-orphan",
    )
