"""Course Recommendation API endpoints (Part 9E)."""

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.recommendation import (
    CourseRecommendationResponse,
    InterestedCourseResponse,
)
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get(
    "/me",
    response_model=List[CourseRecommendationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get My Course Recommendations",
    description="Dynamically calculate explainable course recommendations tailored to the caller's active skill gaps and professional goals.",
)
def get_my_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CourseRecommendationResponse]:
    """Return top recommended courses for current user based on evaluated skill gaps."""
    return recommendation_service.get_recommendations_for_user(
        db,
        current_user,
        limit=limit,
    )


@router.get(
    "/interested",
    response_model=List[InterestedCourseResponse],
    status_code=status.HTTP_200_OK,
    summary="Get User Interested Courses",
    description="Retrieve all courses marked as interested or bookmarked by the learner.",
)
def get_my_interested_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[InterestedCourseResponse]:
    """Return caller's saved interested courses."""
    return recommendation_service.get_user_interested_courses(db, current_user)


@router.post(
    "/interested/{course_id}",
    response_model=InterestedCourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Mark Course as Interested",
    description="Save a course to the learner's interested list. Does not auto-enroll the learner.",
)
def mark_course_interested(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InterestedCourseResponse:
    """Bookmark a course as interested."""
    return recommendation_service.mark_course_interested(db, current_user, course_id)


@router.delete(
    "/interested/{course_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove Course from Interested",
    description="Remove a course from the learner's interested list.",
)
def remove_course_interested(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Remove a course from interested list."""
    recommendation_service.remove_course_interested(db, current_user, course_id)
    return {"status": "success", "message": "Course removed from interested courses list."}
