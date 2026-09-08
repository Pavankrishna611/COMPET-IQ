"""Competency and User Proficiency API endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.competency import (
    CompetencyCreate,
    CompetencyResponse,
    CompetencyUpdate,
    RoleCompetencyRequirementCreate,
    RoleCompetencyRequirementResponse,
    RoleCompetencyRequirementUpdate,
    UserCompetencyCreate,
    UserCompetencyResponse,
    UserCompetencyUpdate,
)
from app.services.competency_service import competency_service

router = APIRouter(prefix="/competencies", tags=["Competencies"])


# -----------------------------------------------------------------------------
# 1. Competency Catalog Operations (Static routes & collection)
# -----------------------------------------------------------------------------
@router.get(
    "",
    response_model=List[CompetencyResponse],
    status_code=status.HTTP_200_OK,
    summary="List Competencies",
    description="Retrieve all competencies with optional filtering by domain, category, or search term.",
)
def get_competencies(
    domain: Optional[str] = Query(None, description="Filter by domain (e.g. Technical, Statistical)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search query against name, code, or description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CompetencyResponse]:
    """Retrieve filtered or full competency catalog."""
    return competency_service.get_all_competencies(db, domain=domain, category=category, search=search)


@router.post(
    "",
    response_model=CompetencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Competency (Admin Only)",
    description="Add a new competency to the organizational dictionary. Requires ADMIN role.",
)
def create_competency(
    comp_in: CompetencyCreate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CompetencyResponse:
    """Create a new competency record."""
    return competency_service.create_competency(db, comp_in)


# -----------------------------------------------------------------------------
# 2. Current User Competency Profile (/me endpoints)
# -----------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=List[UserCompetencyResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Current User Competencies",
    description="Retrieve the authenticated learner's complete evaluated competency profile.",
)
def get_my_competencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[UserCompetencyResponse]:
    """Return caller's own competency evaluations."""
    return competency_service.get_user_competencies(db, current_user.id)


@router.post(
    "/me",
    response_model=UserCompetencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign/Evaluate Own Competency",
    description="Add or self-evaluate a competency proficiency level for the caller.",
)
def create_my_competency(
    eval_in: UserCompetencyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserCompetencyResponse:
    """Assign a competency to the current user."""
    return competency_service.create_user_competency(db, current_user.id, eval_in)


@router.put(
    "/me/{competency_id}",
    response_model=UserCompetencyResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Own Competency Level",
    description="Update the current proficiency level or confidence score for a specific competency.",
)
def update_my_competency(
    competency_id: UUID,
    update_in: UserCompetencyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserCompetencyResponse:
    """Update caller's proficiency level in a competency."""
    return competency_service.update_user_competency(db, current_user.id, competency_id, update_in)


@router.delete(
    "/me/{competency_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove Own Competency",
    description="Remove a competency from the caller's profile.",
)
def delete_my_competency(
    competency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Delete a competency evaluation from caller's profile."""
    competency_service.delete_user_competency(db, current_user.id, competency_id)
    return MessageResponse(message="Competency removed from user profile successfully.")


# -----------------------------------------------------------------------------
# 3. Role Competency Requirements (/role-requirements endpoints)
# -----------------------------------------------------------------------------
@router.get(
    "/role-requirements",
    response_model=List[RoleCompetencyRequirementResponse],
    status_code=status.HTTP_200_OK,
    summary="List Role Competency Requirements",
    description="Retrieve all defined target benchmarks per role, with optional role_id filter.",
)
def get_role_requirements(
    role_id: Optional[UUID] = Query(None, description="Optional filter by Role UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[RoleCompetencyRequirementResponse]:
    """Retrieve role benchmark requirements."""
    return competency_service.get_role_requirements(db, role_id=role_id)


@router.post(
    "/role-requirements",
    response_model=RoleCompetencyRequirementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Role Requirement (Admin Only)",
    description="Define target proficiency benchmark for a role. Requires ADMIN role.",
)
def create_role_requirement(
    req_in: RoleCompetencyRequirementCreate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> RoleCompetencyRequirementResponse:
    """Define a new role competency requirement."""
    return competency_service.create_role_requirement(db, req_in)


@router.put(
    "/role-requirements/{requirement_id}",
    response_model=RoleCompetencyRequirementResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Role Requirement (Admin Only)",
    description="Update required level or priority of a role competency requirement.",
)
def update_role_requirement(
    requirement_id: UUID,
    update_in: RoleCompetencyRequirementUpdate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> RoleCompetencyRequirementResponse:
    """Update role competency requirement."""
    return competency_service.update_role_requirement(db, requirement_id, update_in)


@router.delete(
    "/role-requirements/{requirement_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Role Requirement (Admin Only)",
    description="Delete a role competency requirement. Requires ADMIN role.",
)
def delete_role_requirement(
    requirement_id: UUID,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Delete a role requirement."""
    competency_service.delete_role_requirement(db, requirement_id)
    return MessageResponse(message="Role requirement deleted successfully.")


# -----------------------------------------------------------------------------
# 4. Admin User Competency Access (/users/{user_id})
# -----------------------------------------------------------------------------
@router.get(
    "/users/{user_id}",
    response_model=List[UserCompetencyResponse],
    status_code=status.HTTP_200_OK,
    summary="Get User Competencies (Admin Only)",
    description="Retrieve another user's competency profile. Restricted strictly to administrators.",
)
def get_user_competencies_admin(
    user_id: UUID,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> List[UserCompetencyResponse]:
    """Admin inspects another user's competency profile."""
    return competency_service.get_user_competencies(db, user_id)


# -----------------------------------------------------------------------------
# 5. Single Competency Parameterized Routes (/{competency_id})
# -----------------------------------------------------------------------------
@router.get(
    "/{competency_id}",
    response_model=CompetencyResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Competency Details",
    description="Retrieve metadata for a specific competency by its UUID.",
)
def get_competency(
    competency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompetencyResponse:
    """Get single competency details."""
    return competency_service.get_competency(db, competency_id)


@router.put(
    "/{competency_id}",
    response_model=CompetencyResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Competency (Admin Only)",
    description="Modify competency metadata. Requires ADMIN role.",
)
def update_competency(
    competency_id: UUID,
    update_in: CompetencyUpdate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CompetencyResponse:
    """Update competency metadata."""
    return competency_service.update_competency(db, competency_id, update_in)


@router.delete(
    "/{competency_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Competency (Admin Only)",
    description="Remove a competency from the system. Requires ADMIN role.",
)
def delete_competency(
    competency_id: UUID,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Delete a competency."""
    competency_service.delete_competency(db, competency_id)
    return MessageResponse(message="Competency deleted successfully.")
