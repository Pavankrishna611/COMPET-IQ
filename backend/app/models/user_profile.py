"""User Profile model definition."""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.user import User

# Supported Employment Types & Education Levels
EMPLOYMENT_TYPES = [
    "GOVERNMENT_OFFICER",
    "CONTRACTUAL",
    "TRAINEE",
    "STUDENT",
    "OTHER",
]

EDUCATION_LEVELS = [
    "HIGH_SCHOOL",
    "DIPLOMA",
    "BACHELORS",
    "MASTERS",
    "PHD",
    "OTHER",
]


class UserProfile(BaseModel):
    """Professional information and onboarding state tracking for registered users."""

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    designation: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    employment_type: Mapped[str] = mapped_column(
        String(50),
        default="GOVERNMENT_OFFICER",
        nullable=False,
    )
    experience_years: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    education_level: Mapped[str] = mapped_column(
        String(50),
        default="BACHELORS",
        nullable=False,
    )
    specialization: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    current_work_area: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Onboarding Status Tracking (Steps 1..5)
    # 1 = Basic Profile Created, 2 = Professional Details Added,
    # 3 = Skills Declared, 4 = Initial Competencies Initialized, 5 = Completed
    profile_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    skills_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    competency_initialized: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    onboarding_step: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="profile",
    )
    department: Mapped[Optional["Department"]] = relationship(
        "Department",
        back_populates="user_profiles",
    )
