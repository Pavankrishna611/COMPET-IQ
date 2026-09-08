"""Course Competency mapping model definition."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.competency import Competency
    from app.models.course import Course


class CourseCompetency(BaseModel):
    """Associates a course with the competency it improves and the expected proficiency gain."""

    __tablename__ = "course_competencies"
    __table_args__ = (
        UniqueConstraint("course_id", "competency_id", name="uq_course_competency"),
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competency_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    expected_improvement: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )

    # Relationships
    course: Mapped["Course"] = relationship(
        "Course",
        back_populates="course_competencies",
    )
    competency: Mapped["Competency"] = relationship(
        "Competency",
    )
