"""User response and related entity schemas."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class RoleBriefResponse(BaseModel):
    """Brief role presentation schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None


class DepartmentBriefResponse(BaseModel):
    """Brief department presentation schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str


class UserResponse(BaseModel):
    """Safe user profile response schema without sensitive password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    official_id: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    designation: Optional[str] = None
    experience_years: float
    is_active: bool
    role: Optional[RoleBriefResponse] = None
    department: Optional[DepartmentBriefResponse] = None
    onboarding_completed: bool = False
    created_at: datetime
