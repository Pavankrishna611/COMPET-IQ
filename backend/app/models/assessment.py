"""Assessment model definition."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.assessment_assignment import AssessmentAssignment
    from app.models.assessment_attempt import AssessmentAttempt
    from app.models.question import Question
    from app.models.user import User


class Assessment(BaseModel):
    """Assessment model representing tests, quizzes, and evaluations."""

    __tablename__ = "assessments"

    title: Mapped[str] = mapped_column(
        String(200),
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    instructions: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=30,
        nullable=False,
    )
    difficulty: Mapped[str] = mapped_column(
        String(50),
        default="BEGINNER",
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="DRAFT",
        nullable=False,
        index=True,
    )
    assessment_type: Mapped[str] = mapped_column(
        String(50),
        default="TRAINER_OFFICIAL",
        nullable=False,
        index=True,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Foreign key to user who authored this assessment
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="created_assessments",
    )
    questions: Mapped[List["Question"]] = relationship(
        "Question",
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="Question.sequence_order",
    )
    attempts: Mapped[List["AssessmentAttempt"]] = relationship(
        "AssessmentAttempt",
        back_populates="assessment",
        cascade="all, delete-orphan",
    )
    assignments: Mapped[List["AssessmentAssignment"]] = relationship(
        "AssessmentAssignment",
        back_populates="assessment",
        cascade="all, delete-orphan",
    )
