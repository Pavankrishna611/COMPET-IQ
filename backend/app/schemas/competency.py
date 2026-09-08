"""Competency, UserCompetency, and RoleCompetencyRequirement Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


# -----------------------------------------------------------------------------
# Competency Schemas
# -----------------------------------------------------------------------------
class CompetencyCreate(BaseModel):
    """Schema for creating a new competency."""

    name: str = Field(..., min_length=1, max_length=100, description="Competency name")
    code: str = Field(..., min_length=1, max_length=50, description="Unique competency code")
    description: Optional[str] = Field(None, description="Detailed competency description")
    domain: str = Field(..., min_length=1, max_length=100, description="Competency domain")
    category: Optional[str] = Field(None, max_length=100, description="Optional sub-category")


class CompetencyUpdate(BaseModel):
    """Schema for updating an existing competency."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    domain: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None


class CompetencyResponse(BaseModel):
    """Schema for returning competency details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str
    description: Optional[str] = None
    domain: str
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# -----------------------------------------------------------------------------
# User Competency Profile Schemas
# -----------------------------------------------------------------------------
class UserCompetencyCreate(BaseModel):
    """Schema for assigning or evaluating a user's competency level."""

    competency_id: uuid.UUID = Field(..., description="UUID of the competency")
    current_level: float = Field(..., ge=0.0, le=5.0, description="Proficiency level between 0.0 and 5.0")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Evaluation confidence score between 0.0 and 1.0")


class UserCompetencyUpdate(BaseModel):
    """Schema for updating an existing user competency evaluation."""

    current_level: Optional[float] = Field(None, ge=0.0, le=5.0, description="Updated level 0.0 to 5.0")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Updated confidence 0.0 to 1.0")
    last_assessed_at: Optional[datetime] = Field(None, description="Timestamp of the evaluation")


class UserCompetencyResponse(BaseModel):
    """Schema for returning user competency profile items with competency metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    competency_id: uuid.UUID
    competency_name: str
    competency_code: str
    domain: str
    current_level: float
    confidence_score: float
    last_assessed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_competency_details(cls, data: Any) -> Any:
        """Flatten related competency fields from ORM relationship if present."""
        if hasattr(data, "competency") and data.competency:
            return {
                "id": data.id,
                "competency_id": data.competency_id,
                "competency_name": data.competency.name,
                "competency_code": data.competency.code,
                "domain": data.competency.domain,
                "current_level": data.current_level,
                "confidence_score": data.confidence_score,
                "last_assessed_at": data.last_assessed_at,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
            }
        return data


# -----------------------------------------------------------------------------
# Role Competency Requirements Schemas
# -----------------------------------------------------------------------------
class RoleCompetencyRequirementCreate(BaseModel):
    """Schema for defining required competency level for a specific role."""

    role_id: uuid.UUID = Field(..., description="Target role UUID")
    competency_id: uuid.UUID = Field(..., description="Target competency UUID")
    required_level: float = Field(..., ge=0.0, le=5.0, description="Required target proficiency level (0.0 to 5.0)")
    priority: str = Field("MEDIUM", description="Requirement priority (CRITICAL, HIGH, MEDIUM, LOW)")


class RoleCompetencyRequirementUpdate(BaseModel):
    """Schema for updating a role competency requirement."""

    required_level: Optional[float] = Field(None, ge=0.0, le=5.0)
    priority: Optional[str] = None


class RoleCompetencyRequirementResponse(BaseModel):
    """Schema for returning role competency requirements with role and competency metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role_id: uuid.UUID
    role_name: str
    competency_id: uuid.UUID
    competency_name: str
    domain: str
    required_level: float
    priority: str
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_requirement_details(cls, data: Any) -> Any:
        """Flatten related role and competency fields from ORM relationship if present."""
        if hasattr(data, "role") and hasattr(data, "competency") and data.role and data.competency:
            return {
                "id": data.id,
                "role_id": data.role_id,
                "role_name": data.role.name,
                "competency_id": data.competency_id,
                "competency_name": data.competency.name,
                "domain": data.competency.domain,
                "required_level": data.required_level,
                "priority": data.priority,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
            }
        return data
