"""Practice Quiz Attempt model definition for learner formative practice sessions."""

import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Float, ForeignKey, Integer, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.learning_material import LearningMaterial
    from app.models.user import User


class PracticeQuizAttempt(BaseModel):
    """Personal practice quiz attempt model tracking learner self-assessments.
    
    Kept completely isolated from official AssessmentAttempt and competency evidence
    to ensure formative practice never alters official institutional scores.
    """

    __tablename__ = "practice_quiz_attempts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    learning_material_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("learning_materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
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
    incorrect_answers: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
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
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    # Status tracking (e.g. COMPLETED, IN_PROGRESS)
    status: Mapped[str] = mapped_column(
        String(50),
        default="COMPLETED",
        nullable=False,
    )
    # Storing serialized question reviews [{question_id, question_text, options, selected, correct, is_correct, explanation}]
    submitted_answers: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(
        JSON,
        nullable=True,
    )
    # Storing cached AI Learning Feedback payload
    ai_feedback: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
    )
    learning_material: Mapped["LearningMaterial"] = relationship(
        "LearningMaterial",
    )
