"""User Competency profile model definition."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.competency import Competency
    from app.models.user import User


class UserCompetency(BaseModel):
    """User competency model representing assessed proficiency levels, targets, and gaps."""

    __tablename__ = "user_competencies"
    __table_args__ = (
        UniqueConstraint("user_id", "competency_id", name="uq_user_competency"),
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
    current_level: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    last_assessed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    required_level: Mapped[Optional[float]] = mapped_column(
        Float,
        default=0.0,
        nullable=True,
    )
    gap: Mapped[Optional[float]] = mapped_column(
        Float,
        default=0.0,
        nullable=True,
    )
    priority: Mapped[Optional[str]] = mapped_column(
        String(20),
        default="MEDIUM",
        nullable=True,
    )
    evidence_source: Mapped[Optional[str]] = mapped_column(
        String(50),
        default="INITIAL_ESTIMATE",
        nullable=True,
    )
    evaluation_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="user_competencies",
    )
    competency: Mapped["Competency"] = relationship(
        "Competency",
        back_populates="user_competencies",
    )
