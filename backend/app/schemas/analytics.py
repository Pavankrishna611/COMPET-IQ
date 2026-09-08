"""Analytics request and response schemas."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class DepartmentHealthMetric(BaseModel):
    """Departmental competency and staffing health metric."""

    model_config = ConfigDict(from_attributes=True)

    department_id: Optional[str] = None
    department: str
    total_officers: int
    assessed_officers: int
    assessed_pct: float
    average_competency: float
    critical_gaps: int
    health_status: str  # Excellent, Good, Attention Needed, Critical


class CompetencyDistributionItem(BaseModel):
    """Distribution of competency proficiencies across levels."""

    level: str  # Level 1 (Novice) .. Level 5 (Expert)
    count: int
    percentage: float


class TopSkillGapMetric(BaseModel):
    """Top skill gap ranked by organizational impact."""

    competency: str
    domain: str
    average_gap: float
    affected_officers: int
    priority: str


class WorkforceInsightItem(BaseModel):
    """Data-driven insight derived directly from organizational analytics."""

    id: str
    title: str
    description: str
    impact_level: str  # High, Medium, Low
    category: str  # Competency, Training, Resource
    metric_highlight: str
    source: str = "Data-driven insight"


class DashboardAnalyticsResponse(BaseModel):
    """Executive administrative overview metrics."""

    total_officers: int
    active_learners: int
    average_competency_score: float
    critical_skill_gaps: int
    learning_completion_rate: float
    department_health: List[DepartmentHealthMetric]
    competency_distribution: List[CompetencyDistributionItem]
    top_skill_gaps: List[TopSkillGapMetric]
    insights: List[WorkforceInsightItem]


class WorkforceAnalyticsResponse(BaseModel):
    """Detailed workforce competency and cadre analytics."""

    total_officers: int
    assessed_officers: int
    assessment_coverage_pct: float
    department_metrics: List[DepartmentHealthMetric]
    cadre_distribution: List[Dict[str, Any]]
    competency_domain_averages: List[Dict[str, Any]]


class SkillGapAnalyticsResponse(BaseModel):
    """Organization-wide skill gap intelligence."""

    total_gaps_identified: int
    critical_gaps_count: int
    high_priority_gaps_count: int
    moderate_gaps_count: int
    top_gaps: List[TopSkillGapMetric]
    department_gaps: List[Dict[str, Any]]


class TrainingAnalyticsResponse(BaseModel):
    """Training engagement, course enrollments, and assessment performance."""

    total_assessments_conducted: int
    average_score_pct: float
    pass_rate_pct: float
    total_learning_hours_estimated: float
    active_learning_paths_count: int
    popular_courses: List[Dict[str, Any]]
    recent_assessments_performance: List[Dict[str, Any]]


class AIInsightsResponse(BaseModel):
    """Data-driven analytical insights derived from system database metrics."""

    generated_at: str
    insights: List[WorkforceInsightItem]
