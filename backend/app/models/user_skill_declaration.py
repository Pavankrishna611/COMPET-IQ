"""User Skill Declaration model definition."""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, Float, ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.competency import Competency
    from app.models.user import User

# Self-assessed proficiency scale:
# 1 = No Experience, 2 = Beginner, 3 = Intermediate, 4 = Advanced, 5 = Expert
VALID_SELF_ASSESSED_LEVELS = [1, 2, 3, 4, 5]

# Confidence levels
CONFIDENCE_LEVELS = ["LOW", "MEDIUM", "HIGH"]

# Declaration sources
DECLARATION_SOURCES = ["SELF_DECLARED", "ASSESSMENT", "COURSE_COMPLETION", "ADMIN_VERIFIED"]


class UserSkillDeclaration(BaseModel):
    """Self-assessed skill declarations provided by users during onboarding or profiling."""

    __tablename__ = "user_skill_declarations"
    __table_args__ = (
        UniqueConstraint("user_id", "competency_id", name="uq_user_skill_declaration"),
        CheckConstraint(
            "self_assessed_level >= 1 AND self_assessed_level <= 5",
            name="ck_user_skill_declaration_level",
        ),
        CheckConstraint(
            "confidence_level IN ('LOW', 'MEDIUM', 'HIGH')",
            name="ck_user_skill_declaration_confidence",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competency_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    self_assessed_level: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    confidence_level: Mapped[str] = mapped_column(
        String(20),
        default="MEDIUM",
        nullable=False,
    )
    years_of_experience: Mapped[Optional[float]] = mapped_column(
        Float,
        default=0.0,
        nullable=True,
    )
    last_used: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        default="SELF_DECLARED",
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="skill_declarations",
    )
    competency: Mapped["Competency"] = relationship(
        "Competency",
        back_populates="skill_declarations",
    )

    @validates("self_assessed_level")
    def validate_self_assessed_level(self, key: str, value: int) -> int:
        """Validate that self_assessed_level is an integer between 1 and 5."""
        if not isinstance(value, int) or value < 1 or value > 5:
            raise ValueError(f"self_assessed_level must be between 1 and 5 (got {value})")
        return value

    @validates("confidence_level")
    def validate_confidence_level(self, key: str, value: str) -> str:
        """Validate confidence level is one of LOW, MEDIUM, HIGH."""
        if not value or value.upper() not in {"LOW", "MEDIUM", "HIGH"}:
            raise ValueError(f"confidence_level must be one of LOW, MEDIUM, HIGH (got {value})")
        return value.upper()
