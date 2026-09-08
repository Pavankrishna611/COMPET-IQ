"""User model definition."""

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Float, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.assessment import Assessment
    from app.models.assessment_attempt import AssessmentAttempt
    from app.models.chat_conversation import ChatConversation
    from app.models.department import Department
    from app.models.generated_question import GeneratedQuestion
    from app.models.learning_material import LearningMaterial
    from app.models.learning_path import LearningPath
    from app.models.role import Role
    from app.models.user_competency import UserCompetency
    from app.models.user_profile import UserProfile
    from app.models.user_skill_declaration import UserSkillDeclaration


class User(BaseModel):
    """User model representing registered learners, trainers, and administrators."""

    __tablename__ = "users"

    official_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )
    phone_number: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    designation: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    experience_years: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Foreign Keys
    role_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    role: Mapped[Optional["Role"]] = relationship(
        "Role",
        back_populates="users",
    )
    department: Mapped[Optional["Department"]] = relationship(
        "Department",
        back_populates="users",
    )
    user_competencies: Mapped[List["UserCompetency"]] = relationship(
        "UserCompetency",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    learning_paths: Mapped[List["LearningPath"]] = relationship(
        "LearningPath",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    created_assessments: Mapped[List["Assessment"]] = relationship(
        "Assessment",
        back_populates="creator",
    )
    assessment_attempts: Mapped[List["AssessmentAttempt"]] = relationship(
        "AssessmentAttempt",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    learning_materials: Mapped[List["LearningMaterial"]] = relationship(
        "LearningMaterial",
        back_populates="uploader",
        cascade="all, delete-orphan",
    )
    generated_questions: Mapped[List["GeneratedQuestion"]] = relationship(
        "GeneratedQuestion",
        back_populates="creator",
    )
    chat_conversations: Mapped[List["ChatConversation"]] = relationship(
        "ChatConversation",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    skill_declarations: Mapped[List["UserSkillDeclaration"]] = relationship(
        "UserSkillDeclaration",
        back_populates="user",
        cascade="all, delete-orphan",
    )
