"""Course model definition."""

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.course_competency import CourseCompetency
    from app.models.course_prerequisite import CoursePrerequisite
    from app.models.learning_path_item import LearningPathItem


class Course(BaseModel):
    """Course model representing learning modules, providers, and metadata."""

    __tablename__ = "courses"

    title: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    provider: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    domain: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    difficulty: Mapped[str] = mapped_column(
        String(50),
        default="Beginner",
        nullable=False,
    )
    duration_hours: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    course_competencies: Mapped[List["CourseCompetency"]] = relationship(
        "CourseCompetency",
        back_populates="course",
        cascade="all, delete-orphan",
    )
    prerequisites: Mapped[List["CoursePrerequisite"]] = relationship(
        "CoursePrerequisite",
        foreign_keys="CoursePrerequisite.course_id",
        back_populates="course",
        cascade="all, delete-orphan",
    )
    dependent_courses: Mapped[List["CoursePrerequisite"]] = relationship(
        "CoursePrerequisite",
        foreign_keys="CoursePrerequisite.prerequisite_course_id",
        back_populates="prerequisite_course",
        cascade="all, delete-orphan",
    )
    learning_path_items: Mapped[List["LearningPathItem"]] = relationship(
        "LearningPathItem",
        back_populates="course",
    )
