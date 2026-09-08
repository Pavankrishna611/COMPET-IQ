"""Skill Gap Analysis response and summary schemas."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class SkillGapResponse(BaseModel):
    """Detailed gap analysis item for an individual competency."""

    model_config = ConfigDict(from_attributes=True)

    competency_id: uuid.UUID
    competency_name: str
    competency_code: str
    domain: str
    current_level: float
    required_level: float
    gap: float
    priority: str
    recommended_action: str


class SkillGapSummary(BaseModel):
    """Statistical overview of competency proficiencies and gap priorities."""

    total_competencies: int
    critical_gaps: int
    high_priority_gaps: int
    moderate_gaps: int
    low_priority_gaps: int
    strong_competencies: int
    average_competency: float
    average_gap: float


class SkillGapAnalysisResponse(BaseModel):
    """Complete personalized skill gap analysis report."""

    user_id: uuid.UUID
    role: str
    summary: SkillGapSummary
    skill_gaps: List[SkillGapResponse]
    analyzed_at: datetime


class TopSkillGap(BaseModel):
    """Aggregated organizational gap metric for a specific competency."""

    competency: str
    average_gap: float
    affected_users: int


class OrganizationSkillGapSummaryResponse(BaseModel):
    """Aggregated organizational competency gap report for administrative analytics."""

    total_users_analyzed: int
    top_skill_gaps: List[TopSkillGap]
    analyzed_at: datetime
