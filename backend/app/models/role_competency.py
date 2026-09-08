"""Role Competency Requirement model definition."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.competency import Competency
    from app.models.role import Role


class RoleCompetencyRequirement(BaseModel):
    """Model defining target competency benchmarks and priorities per organizational role."""

    __tablename__ = "role_competency_requirements"
    __table_args__ = (
        UniqueConstraint("role_id", "competency_id", name="uq_role_competency"),
    )

    role_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competency_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("competencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    required_level: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )
    priority: Mapped[str] = mapped_column(
        String(20),
        default="MEDIUM",
        nullable=False,
    )

    # Relationships
    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="competency_requirements",
    )
    competency: Mapped["Competency"] = relationship(
        "Competency",
        back_populates="role_requirements",
    )
