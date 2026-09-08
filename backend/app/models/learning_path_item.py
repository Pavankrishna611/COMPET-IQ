"""Learning Path Item model definition."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.learning_path import LearningPath


class LearningPathItem(BaseModel):
    """Step or course recommendation within a personalized learning journey."""

    __tablename__ = "learning_path_items"
    __table_args__ = (
        UniqueConstraint("learning_path_id", "sequence_order", name="uq_learning_path_sequence"),
    )

    learning_path_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="NOT_STARTED",
        nullable=False,
    )
    priority: Mapped[str] = mapped_column(
        String(20),
        default="MODERATE",
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    estimated_duration_hours: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    # Relationships
    learning_path: Mapped["LearningPath"] = relationship(
        "LearningPath",
        back_populates="items",
    )
    course: Mapped["Course"] = relationship(
        "Course",
        back_populates="learning_path_items",
    )
