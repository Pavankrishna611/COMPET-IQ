"""Department model definition."""

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.user_profile import UserProfile


class Department(BaseModel):
    """Department model representing institutional statistical/administrative divisions."""

    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )
    code: Mapped[str] = mapped_column(
        String(20),
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
        back_populates="department",
    )
    user_profiles: Mapped[List["UserProfile"]] = relationship(
        "UserProfile",
        back_populates="department",
    )
