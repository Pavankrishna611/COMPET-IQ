"""API Routers Package."""

from app.api.auth import router as auth_router
from app.api.competencies import router as competencies_router
from app.api.courses import router as courses_router
from app.api.health import router as health_router
from app.api.learning_paths import router as learning_paths_router
from app.api.onboarding import router as onboarding_router
from app.api.recommendations import router as recommendations_router
from app.api.skill_gaps import router as skill_gaps_router

__all__ = [
    "health_router",
    "auth_router",
    "competencies_router",
    "skill_gaps_router",
    "courses_router",
    "recommendations_router",
    "learning_paths_router",
    "onboarding_router",
]
