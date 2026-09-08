"""Course Recommendation API endpoints."""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.recommendation import CourseRecommendationResponse
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get(
    "/me",
    response_model=List[CourseRecommendationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get My Course Recommendations",
    description="Dynamically calculate explainable course recommendations tailored to the caller's active skill gaps.",
)
def get_my_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CourseRecommendationResponse]:
    """Return top recommended courses for current user."""
    return recommendation_service.get_recommendations_for_user(
        db,
        current_user,
        limit=limit,
    )
