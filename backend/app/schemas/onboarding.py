"""Onboarding and user profile request and response schemas."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileCreate(BaseModel):
    """Schema for submitting professional profile details."""

    department_id: Optional[uuid.UUID] = Field(None, description="Assigned Department UUID")
    designation: Optional[str] = Field(None, max_length=100, description="Job designation / title")
    employment_type: str = Field(
        "GOVERNMENT_OFFICER",
        description="Employment type: GOVERNMENT_OFFICER, CONTRACTUAL, TRAINEE, STUDENT, OTHER",
    )
    experience_years: float = Field(0.0, ge=0.0, description="Total years of professional experience")
    education_level: str = Field(
        "BACHELORS",
        description="Highest education level: HIGH_SCHOOL, DIPLOMA, BACHELORS, MASTERS, PHD, OTHER",
    )
    specialization: Optional[str] = Field(None, max_length=100, description="Academic specialization or major")
    current_work_area: Optional[str] = Field(None, max_length=150, description="Current division or functional area")
    location: Optional[str] = Field(None, max_length=100, description="Posting city or headquarters location")
    bio: Optional[str] = Field(None, description="Brief professional background statement")


class ProfileUpdate(BaseModel):
    """Schema for updating professional profile details."""

    department_id: Optional[uuid.UUID] = None
    designation: Optional[str] = None
    employment_type: Optional[str] = None
    experience_years: Optional[float] = Field(None, ge=0.0)
    education_level: Optional[str] = None
    specialization: Optional[str] = None
    current_work_area: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None


class ProfileResponse(BaseModel):
    """Response schema for professional profile details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    designation: Optional[str] = None
    employment_type: str
    experience_years: float
    education_level: str
    specialization: Optional[str] = None
    current_work_area: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    profile_completed: bool
    skills_completed: bool
    onboarding_completed: bool
    onboarding_step: int
    created_at: datetime
    updated_at: datetime


class SkillDeclarationCreate(BaseModel):
    """Self-assessed skill declaration input."""

    competency_id: uuid.UUID = Field(..., description="UUID of declared competency")
    self_assessed_level: int = Field(
        ...,
        ge=1,
        le=5,
        description="Self-assessed proficiency: 1 (No Exp), 2 (Beginner), 3 (Intermediate), 4 (Advanced), 5 (Expert)",
    )
    confidence_level: str = Field(
        "MEDIUM",
        description="Self-assessed confidence: LOW, MEDIUM, or HIGH",
    )
    years_of_experience: Optional[float] = Field(0.0, ge=0.0, description="Years practicing this specific competency")
    last_used: Optional[str] = Field(None, max_length=50, description="Recency indicator, e.g. CURRENTLY_USING")

    @field_validator("confidence_level")
    @classmethod
    def validate_confidence(cls, v: str) -> str:
        if v.upper() not in {"LOW", "MEDIUM", "HIGH"}:
            raise ValueError("confidence_level must be one of LOW, MEDIUM, HIGH")
        return v.upper()


class SkillDeclarationUpdate(BaseModel):
    """Schema for updating an existing skill declaration."""

    self_assessed_level: Optional[int] = Field(None, ge=1, le=5)
    confidence_level: Optional[str] = None
    years_of_experience: Optional[float] = Field(None, ge=0.0)
    last_used: Optional[str] = None

    @field_validator("confidence_level")
    @classmethod
    def validate_confidence(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if v.upper() not in {"LOW", "MEDIUM", "HIGH"}:
                raise ValueError("confidence_level must be one of LOW, MEDIUM, HIGH")
            return v.upper()
        return v


class SkillDeclarationResponse(BaseModel):
    """Response schema for declared skill."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    competency_id: uuid.UUID
    competency_name: str
    competency_code: Optional[str] = None
    competency_domain: Optional[str] = None
    domain: Optional[str] = None
    category: Optional[str] = None
    self_assessed_level: int
    confidence_level: str
    years_of_experience: float = 0.0
    last_used: Optional[str] = None
    source: str = "SELF_DECLARED"
    created_at: datetime
    updated_at: datetime


class BulkSkillDeclarationRequest(BaseModel):
    """Payload for declaring multiple skills simultaneously."""

    skills: List[SkillDeclarationCreate] = Field(..., min_length=1, description="List of declared skills")


class OnboardingStatusResponse(BaseModel):
    """Onboarding stage progression and recommended next action."""

    model_config = ConfigDict(from_attributes=True)

    current_step: int = Field(..., description="Step 1 to 5")
    profile_completed: bool
    skills_completed: bool
    competency_initialized: bool = Field(..., description="Whether initial competencies have been calculated")
    onboarding_completed: bool
    next_action: str = Field(..., description="Actionable prompt guiding user to next onboarding milestone")


class CompetencyOption(BaseModel):
    """Available competency item for onboarding skill selection."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    domain: Optional[str] = None


class CompetencyDomainGroup(BaseModel):
    """Catalog of competencies grouped by domain."""

    domain: str
    competencies: List[CompetencyOption]


class AvailableCompetenciesResponse(BaseModel):
    """Response containing available competencies grouped by domain for onboarding."""

    domains: List[CompetencyDomainGroup]


class CompetencyItemResponse(BaseModel):
    """Competency summary item."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str
    domain: str
    category: Optional[str] = None
    description: Optional[str] = None


class CompetencyDomainGroupResponse(BaseModel):
    """Catalog of competencies grouped by high-level domain."""

    domain: str
    competencies: List[CompetencyItemResponse]


class InitializedCompetencyItem(BaseModel):
    """Details of competency initialized from self-declaration."""

    competency_id: uuid.UUID
    competency_name: str
    competency_code: str
    self_assessed_level: int
    confidence_level: str
    calculated_level: float
    confidence_score: float
    is_new: bool


class CompetencyInitResponse(BaseModel):
    """Response returned upon generating initial competency profile."""

    message: str
    total_initialized: int
    overall_competency_score: float
    competencies: List[InitializedCompetencyItem]


class OnboardingCompleteResponse(BaseModel):
    """Response returned upon finalizing onboarding journey."""

    message: str
    onboarding_completed: bool
    next_actions: List[str]


class RecommendedAssessmentResponse(BaseModel):
    """Recommended published assessment to validate declared competencies."""

    assessment_id: uuid.UUID
    title: str
    description: Optional[str] = None
    duration_minutes: int
    difficulty: str
    recommendation_reason: str
    matched_competencies: List[str]


class UserProfileSummaryResponse(BaseModel):
    """Comprehensive single-pane view of user profile, onboarding, and intelligence aggregates."""

    user: Dict[str, Any]
    professional_profile: Dict[str, Any]
    onboarding: Dict[str, Any]
    summary: Dict[str, Any]
