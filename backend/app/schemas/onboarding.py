"""Onboarding and user profile request and response schemas."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileCreate(BaseModel):
    """Schema for submitting professional profile details."""

    department_id: Optional[uuid.UUID] = Field(None, description="Assigned Department UUID")
    department: Optional[str] = Field(None, max_length=150, description="Department name or division")
    designation: Optional[str] = Field(None, max_length=100, description="Job designation / title")
    job_role: Optional[str] = Field(None, max_length=100, description="Functional job role")
    current_assignment: Optional[str] = Field(None, description="Description of current work/assignment")
    employment_type: str = Field(
        "GOVERNMENT_OFFICER",
        description="Employment type: GOVERNMENT_OFFICER, CONTRACTUAL, TRAINEE, STUDENT, OTHER",
    )
    experience_years: float = Field(0.0, ge=0.0, description="Total years of professional experience")
    experience: Optional[Union[float, str]] = Field(None, description="Experience alias or range option")
    education_level: str = Field(
        "BACHELORS",
        description="Highest education level: HIGH_SCHOOL, DIPLOMA, BACHELORS, MASTERS, PHD, OTHER",
    )
    education: Optional[str] = Field(None, description="Education level alias")
    specialization: Optional[str] = Field(None, max_length=100, description="Academic specialization or major")
    current_work_area: Optional[str] = Field(None, max_length=150, description="Current division or functional area")
    previous_trainings: Optional[str] = Field(None, description="Previous courses or training programs")
    professional_goal: Optional[str] = Field(None, description="Career and learning objectives")
    career_goal: Optional[str] = Field(None, description="Career goal alias")
    location: Optional[str] = Field(None, max_length=100, description="Posting city or headquarters location")
    bio: Optional[str] = Field(None, description="Brief professional background statement")


class ProfileUpdate(BaseModel):
    """Schema for updating professional profile details."""

    department_id: Optional[uuid.UUID] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    job_role: Optional[str] = None
    current_assignment: Optional[str] = None
    employment_type: Optional[str] = None
    experience_years: Optional[float] = Field(None, ge=0.0)
    experience: Optional[Union[float, str]] = None
    education_level: Optional[str] = None
    education: Optional[str] = None
    specialization: Optional[str] = None
    current_work_area: Optional[str] = None
    previous_trainings: Optional[str] = None
    professional_goal: Optional[str] = None
    career_goal: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None


class ProfileResponse(BaseModel):
    """Response schema for professional profile details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    full_name: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    job_role: Optional[str] = None
    current_assignment: Optional[str] = None
    employment_type: str
    experience_years: float
    experience: Optional[Union[float, str]] = None
    education_level: str
    education: Optional[str] = None
    specialization: Optional[str] = None
    current_work_area: Optional[str] = None
    previous_trainings: Optional[str] = None
    professional_goal: Optional[str] = None
    career_goal: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    profile_completed: bool
    skills_completed: bool
    onboarding_completed: bool
    onboarding_step: int
    created_at: datetime
    updated_at: datetime

    @field_validator("department", mode="before")
    @classmethod
    def serialize_department(cls, v: Any) -> Optional[str]:
        if hasattr(v, "name"):
            return v.name
        if isinstance(v, str):
            return v
        return None


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


class ProfileAnalysisRequest(BaseModel):
    """Optional payload for direct profile analysis."""

    department: Optional[str] = Field(None, max_length=150, description="Department name or division")
    designation: Optional[str] = Field(None, max_length=100, description="Job designation / title")
    job_role: Optional[str] = Field(None, max_length=100, description="Functional job role")
    current_assignment: Optional[str] = Field(None, description="Description of current work/assignment")
    assignment: Optional[str] = Field(None, description="Alias for current_assignment")
    employment_type: Optional[str] = Field(None, description="Employment type")
    experience_years: Optional[float] = Field(None, ge=0.0, description="Total years of professional experience")
    experience: Optional[Union[float, str]] = Field(None, description="Experience alias or range option")
    education_level: Optional[str] = Field(None, description="Highest education level")
    education: Optional[str] = Field(None, description="Education level alias")
    specialization: Optional[str] = Field(None, max_length=100, description="Academic specialization or major")
    current_work_area: Optional[str] = Field(None, max_length=150, description="Current division or functional area")
    previous_trainings: Optional[str] = Field(None, description="Previous courses or training programs")
    professional_goal: Optional[str] = Field(None, description="Career and learning objectives")
    career_goal: Optional[str] = Field(None, description="Career goal alias")
    location: Optional[str] = Field(None, max_length=100, description="Posting city or headquarters location")
    bio: Optional[str] = Field(None, description="Brief professional background statement")


class SuggestedCompetencyResponse(BaseModel):
    """Structured AI competency recommendation based on learner profile."""

    competency_id: uuid.UUID
    competency_name: str
    domain: str
    relevance_reason: str
    required_level: float
    priority: str


class AcceptedCompetencyItem(BaseModel):
    """Item accepted by learner during competency review."""

    competency_id: uuid.UUID
    competency_name: Optional[str] = None
    domain: Optional[str] = None
    required_level: Optional[float] = 3.0
    priority: Optional[str] = "MEDIUM"


class AcceptCompetenciesRequest(BaseModel):
    """Payload of competencies accepted by learner."""

    competencies: List[AcceptedCompetencyItem]


class AcceptCompetenciesResponse(BaseModel):
    """Confirmation returned when learner accepts recommended competencies."""

    status: str
    message: str
    saved_count: int
    competency_ids: List[uuid.UUID]


# =============================================================================
# Part 9D: Competency Evaluation & Skill-Gap Analysis Schemas
# =============================================================================

class CompetencyEvaluationItem(BaseModel):
    """Evaluated competency item with current proficiency, benchmark, and gap."""

    competency_id: uuid.UUID
    competency_name: str
    competency_code: str
    domain: str
    current_level: float
    current_level_source: str = Field(
        ...,
        description="Evidence source: ASSESSED, TRAINING, EXPERIENCE, SELF_REPORTED, INITIAL_ESTIMATE",
    )
    required_level: float
    gap: float = Field(..., ge=0.0, description="Non-negative gap: max(0.0, required - current)")
    priority: str = Field(..., description="Priority: CRITICAL, HIGH, MEDIUM, LOW, MET")
    relevance: str = "HIGH"
    why_required: str
    evidence: str
    requirement_met: bool = False


class CompetencyEvaluationSummary(BaseModel):
    """High-level summary indicators for competency evaluation."""

    total_competencies: int
    requirements_met: int
    critical_gaps: int
    high_priority_gaps: int
    moderate_gaps: int
    low_priority_gaps: int
    average_current_level: float
    average_required_level: float
    overall_competency_score: Optional[float] = None
    overall_gap_indicator: str = "Action Required"


class LearnerProfileSummaryInfo(BaseModel):
    """Learner professional profile context displayed on evaluation dashboard."""

    full_name: Optional[str] = None
    designation: Optional[str] = None
    job_role: Optional[str] = None
    department: Optional[str] = None
    career_goal: Optional[str] = None


class CompetencyEvaluationResponse(BaseModel):
    """Comprehensive competency evaluation and gap analysis response for learner."""

    learner_profile: LearnerProfileSummaryInfo
    summary: CompetencyEvaluationSummary
    competencies: List[CompetencyEvaluationItem]
    evaluated_at: datetime
