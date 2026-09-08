"""Skill Gap Analysis API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.skill_gap import (
    OrganizationSkillGapSummaryResponse,
    SkillGapAnalysisResponse,
)
from app.services.skill_gap_service import skill_gap_service

router = APIRouter(prefix="/skill-gaps", tags=["Skill Gap Analysis"])


@router.get(
    "/me",
    response_model=SkillGapAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Get My Skill Gap Analysis",
    description="Calculate and return the personalized skill gap report for the current authenticated user.",
)
def get_my_skill_gaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SkillGapAnalysisResponse:
    """Analyze skill gaps for the authenticated caller."""
    return skill_gap_service.analyze_user_skill_gaps(db, current_user)


@router.get(
    "/organization/summary",
    response_model=OrganizationSkillGapSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Organizational Skill Gap Summary (Admin Only)",
    description="Generate aggregated skill gap intelligence across all or filtered active users. Requires ADMIN role.",
)
def get_organization_summary(
    department_id: Optional[UUID] = Query(None, description="Filter analytics by department UUID"),
    role_id: Optional[UUID] = Query(None, description="Filter analytics by role UUID"),
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> OrganizationSkillGapSummaryResponse:
    """Generate aggregated organizational intelligence report."""
    return skill_gap_service.get_organization_summary(
        db,
        department_id=department_id,
        role_id=role_id,
    )


@router.get(
    "/users/{user_id}",
    response_model=SkillGapAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User Skill Gap Analysis (Admin Only)",
    description="Inspect skill gap analysis for a specific user. Requires ADMIN role.",
)
def get_user_skill_gaps(
    user_id: UUID,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> SkillGapAnalysisResponse:
    """Admin inspects specific user's skill gap report."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )
    return skill_gap_service.analyze_user_skill_gaps(db, target_user)
