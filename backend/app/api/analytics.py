"""Organization and Administrative Analytics API Router."""

import logging
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics import (
    AIInsightsResponse,
    DashboardAnalyticsResponse,
    SkillGapAnalyticsResponse,
    TrainingAnalyticsResponse,
    WorkforceAnalyticsResponse,
)
from app.services.analytics_service import analytics_service

logger = logging.getLogger("competiq.api.analytics")

router = APIRouter(prefix="/analytics", tags=["Admin Analytics"])


@router.get(
    "/dashboard",
    response_model=DashboardAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Administrative Overview Analytics",
    description="Retrieve executive dashboard summary metrics including workforce counts, average competencies, critical gaps, and department breakdowns. Restricted to ADMIN.",
)
def get_dashboard_analytics(
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> DashboardAnalyticsResponse:
    """Return executive dashboard overview."""
    return analytics_service.get_dashboard_analytics(db)


@router.get(
    "/workforce",
    response_model=WorkforceAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Workforce Analytics",
    description="Retrieve detailed workforce competency, assessment coverage, and cadre distributions. Restricted to ADMIN.",
)
def get_workforce_analytics(
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> WorkforceAnalyticsResponse:
    """Return workforce competency metrics."""
    return analytics_service.get_workforce_analytics(db)


@router.get(
    "/skill-gaps",
    response_model=SkillGapAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Organization Skill Gap Analytics",
    description="Retrieve ranked competency gaps across divisions and critical count distributions. Restricted to ADMIN.",
)
def get_skill_gap_analytics(
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> SkillGapAnalyticsResponse:
    """Return organization skill gap metrics."""
    return analytics_service.get_skill_gap_analytics(db)


@router.get(
    "/training",
    response_model=TrainingAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Training & Assessment Analytics",
    description="Retrieve assessment completion metrics, pass rates, and course engagement statistics. Restricted to ADMIN.",
)
def get_training_analytics(
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> TrainingAnalyticsResponse:
    """Return training and assessment metrics."""
    return analytics_service.get_training_analytics(db)


@router.get(
    "/insights",
    response_model=AIInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Data-Driven Organizational Insights",
    description="Retrieve explainable, data-grounded insights derived from organizational competency and training records. Restricted to ADMIN.",
)
def get_insights(
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> AIInsightsResponse:
    """Return data-driven organizational insights."""
    return analytics_service.get_insights(db)
