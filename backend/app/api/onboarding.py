from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.onboarding import (
    AvailableCompetenciesResponse,
    BulkSkillDeclarationRequest,
    OnboardingStatusResponse,
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    SkillDeclarationResponse,
    SkillDeclarationUpdate,
)
from app.services.competency_service import competency_service
from app.services.profile_service import profile_service
from app.services.skill_declaration_service import skill_declaration_service

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.get(
    "/competencies",
    response_model=AvailableCompetenciesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Available Competencies",
    description="Retrieve all available competencies grouped logically by domain for onboarding.",
)
def get_available_competencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AvailableCompetenciesResponse:
    """Retrieve available competencies grouped by domain for onboarding."""
    return competency_service.get_available_competencies_grouped(db=db)


@router.get(
    "/status",
    response_model=OnboardingStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Onboarding Status",
    description="Retrieve the current onboarding progression step and actionable guidance for the authenticated user.",
)
def get_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OnboardingStatusResponse:
    """Retrieve onboarding progression state and next action."""
    return profile_service.get_onboarding_status(db=db, user=current_user)


@router.post(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create User Profile",
    description="Create professional user profile for the currently authenticated user.",
)
def create_profile(
    profile_in: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    """Create professional profile for the authenticated user."""
    profile = profile_service.create_profile(db=db, user=current_user, profile_in=profile_in)
    return profile


@router.get(
    "/profile/me",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Fetch professional user profile of the currently authenticated user.",
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    """Retrieve the authenticated user's professional profile."""
    profile = profile_service.get_profile_by_user(db=db, user=current_user)
    return profile


@router.put(
    "/profile/me",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Current User Profile",
    description="Update allowed fields of the authenticated user's professional profile.",
)
def update_my_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    """Update professional profile of the authenticated user."""
    profile = profile_service.update_profile(db=db, user=current_user, profile_in=profile_in)
    return profile


# -----------------------------------------------------------------------------
# User Skill Declaration Endpoints (Self-Declared Skills)
# -----------------------------------------------------------------------------
@router.post(
    "/skills",
    response_model=List[SkillDeclarationResponse],
    status_code=status.HTTP_200_OK,
    summary="Declare Skills in Bulk",
    description="Allow authenticated user to declare multiple self-assessed skills during onboarding.",
)
def declare_skills(
    bulk_in: BulkSkillDeclarationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[SkillDeclarationResponse]:
    """Submit multiple self-assessed skill declarations in bulk."""
    return skill_declaration_service.declare_skills_bulk(db=db, user=current_user, bulk_in=bulk_in)


@router.get(
    "/skills/me",
    response_model=List[SkillDeclarationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get My Declared Skills",
    description="Retrieve all self-assessed skill declarations for the authenticated user.",
)
def get_my_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[SkillDeclarationResponse]:
    """Fetch authenticated user's declared skills."""
    return skill_declaration_service.get_my_skills(db=db, user=current_user)


@router.put(
    "/skills/{competency_id}",
    response_model=SkillDeclarationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Declared Skill",
    description="Update an existing self-assessed skill declaration for the authenticated user.",
)
def update_declared_skill(
    competency_id: UUID,
    update_in: SkillDeclarationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SkillDeclarationResponse:
    """Update a specific declared skill."""
    return skill_declaration_service.update_skill_declaration(
        db=db,
        user=current_user,
        competency_id=competency_id,
        update_in=update_in,
    )


@router.delete(
    "/skills/{competency_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Declared Skill",
    description="Delete a self-assessed skill declaration for the authenticated user.",
)
def delete_declared_skill(
    competency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Delete a specific declared skill."""
    return skill_declaration_service.delete_skill_declaration(
        db=db,
        user=current_user,
        competency_id=competency_id,
    )
