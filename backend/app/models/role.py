"""Role model definition."""

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.role_competency import RoleCompetencyRequirement
    from app.models.user import User


class Role(BaseModel):
    """Role model representing system permission and persona levels (LEARNER, TRAINER, ADMIN)."""

    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="role",
        cascade="all, delete-orphan",
    )
    competency_requirements: Mapped[List["RoleCompetencyRequirement"]] = relationship(
        "RoleCompetencyRequirement",
        back_populates="role",
        cascade="all, delete-orphan",
    )
