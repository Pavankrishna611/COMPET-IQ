"""Course catalog and learning material management API endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.course import (
    CourseCompetencyCreate,
    CourseCompetencyResponse,
    CourseCreate,
    CoursePrerequisiteCreate,
    CoursePrerequisiteResponse,
    CourseResponse,
    CourseUpdate,
)
from app.services.course_service import course_service

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get(
    "",
    response_model=List[CourseResponse],
    status_code=status.HTTP_200_OK,
    summary="List Courses",
    description="Retrieve all available courses with optional filtering by provider, domain, difficulty, or search text.",
)
def get_courses(
    provider: Optional[str] = Query(None, description="Filter by course provider (e.g. iGOT Karmayogi, NSSTA)"),
    domain: Optional[str] = Query(None, description="Filter by knowledge domain"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (Beginner, Intermediate, Advanced)"),
    search: Optional[str] = Query(None, description="Search query against course title and description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CourseResponse]:
    """List and filter learning courses."""
    return course_service.get_courses(
        db,
        provider=provider,
        domain=domain,
        difficulty=difficulty,
        is_active=True,
        search=search,
    )


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Course Details",
    description="Retrieve full metadata for a specific course including prerequisites and addressed competencies.",
)
def get_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseResponse:
    """Get single course details."""
    return course_service.get_course(db, course_id)


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Course (Admin Only)",
    description="Register a new learning course in the system catalog. Requires ADMIN role.",
)
def create_course(
    course_in: CourseCreate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CourseResponse:
    """Create a new course."""
    return course_service.create_course(db, course_in)


@router.put(
    "/{course_id}",
    response_model=CourseResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Course (Admin Only)",
    description="Update metadata for an existing course. Requires ADMIN role.",
)
def update_course(
    course_id: UUID,
    update_in: CourseUpdate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CourseResponse:
    """Update course metadata."""
    return course_service.update_course(db, course_id, update_in)


@router.delete(
    "/{course_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Course (Admin Only)",
    description="Remove a course from the catalog. Requires ADMIN role.",
)
def delete_course(
    course_id: UUID,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Delete a course."""
    course_service.delete_course(db, course_id)
    return MessageResponse(message="Course deleted successfully.")


@router.post(
    "/{course_id}/competencies",
    response_model=CourseCompetencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Assign Competency to Course (Admin Only)",
    description="Map a competency to a course with expected proficiency improvement. Requires ADMIN role.",
)
def assign_course_competency(
    course_id: UUID,
    comp_in: CourseCompetencyCreate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CourseCompetencyResponse:
    """Assign competency to course."""
    return course_service.assign_course_competency(db, course_id, comp_in)


@router.post(
    "/{course_id}/prerequisites",
    response_model=CoursePrerequisiteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Course Prerequisite (Admin Only)",
    description="Define a prerequisite course dependency. Requires ADMIN role.",
)
def add_course_prerequisite(
    course_id: UUID,
    prereq_in: CoursePrerequisiteCreate,
    admin_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
) -> CoursePrerequisiteResponse:
    """Add course prerequisite dependency."""
    return course_service.add_course_prerequisite(db, course_id, prereq_in)
