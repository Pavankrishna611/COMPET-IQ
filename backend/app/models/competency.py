"""Competency model definition."""

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.question import Question
    from app.models.role_competency import RoleCompetencyRequirement
    from app.models.user_competency import UserCompetency
    from app.models.user_skill_declaration import UserSkillDeclaration


class Competency(BaseModel):
    """Competency model representing skills, methods, and knowledge domains."""

    __tablename__ = "competencies"

    name: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    domain: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    category: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    # Relationships
    user_competencies: Mapped[List["UserCompetency"]] = relationship(
        "UserCompetency",
        back_populates="competency",
        cascade="all, delete-orphan",
    )
    role_requirements: Mapped[List["RoleCompetencyRequirement"]] = relationship(
        "RoleCompetencyRequirement",
        back_populates="competency",
        cascade="all, delete-orphan",
    )
    questions: Mapped[List["Question"]] = relationship(
        "Question",
        back_populates="competency",
    )
    skill_declarations: Mapped[List["UserSkillDeclaration"]] = relationship(
        "UserSkillDeclaration",
        back_populates="competency",
        cascade="all, delete-orphan",
    )
