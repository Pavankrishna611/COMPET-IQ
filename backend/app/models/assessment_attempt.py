"""Assessment Attempt model definition."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.assessment import Assessment
    from app.models.question_attempt import QuestionAttempt
    from app.models.user import User


class AssessmentAttempt(BaseModel):
    """Assessment attempt model tracking individual test sessions, submissions, and scores."""

    __tablename__ = "assessment_attempts"

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="IN_PROGRESS",
        nullable=False,
        index=True,
    )
    score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    percentage: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    correct_answers: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # Relationships
    assessment: Mapped["Assessment"] = relationship(
        "Assessment",
        back_populates="attempts",
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="assessment_attempts",
    )
    question_attempts: Mapped[List["QuestionAttempt"]] = relationship(
        "QuestionAttempt",
        back_populates="attempt",
        cascade="all, delete-orphan",
    )
