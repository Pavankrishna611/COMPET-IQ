"""Authentication and user access endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.core.config import settings
from app.core.security import create_access_token
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import TokenResponse, TokenUser, UserLogin, UserRegister
from app.schemas.common import MessageResponse
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Public User Registration",
    description="Register a new public learner account. Strictly assigns LEARNER role.",
)
def register(user_in: UserRegister, db: Session = Depends(get_db)) -> User:
    """Register a new public user account with LEARNER role."""
    user = auth_service.register_public_user(db=db, user_in=user_in)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticate user credentials and receive a JWT access token.",
)
def login(login_in: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate with email and password to receive a JWT access token."""
    user = auth_service.authenticate_user(db=db, email=login_in.email, password=login_in.password)
    user_role_name = user.role.name if user.role else "LEARNER"

    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    token = create_access_token(
        subject=str(user.id),
        role=user_role_name,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        user=TokenUser(
            id=str(user.id),
            full_name=user.full_name,
            email=user.email,
            role=user_role_name,
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Retrieve the profile of the currently authenticated user.",
)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Return currently authenticated user profile."""
    return current_user


@router.get(
    "/protected",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Protected Verification Endpoint",
    description="Verification endpoint accessible to any authenticated user.",
)
def test_protected(current_user: User = Depends(get_current_user)) -> MessageResponse:
    """Verification route for authenticated users."""
    return MessageResponse(message="Authenticated successfully")


@router.get(
    "/admin-only",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin-Only Verification Endpoint",
    description="Verification endpoint accessible strictly to users with the ADMIN role.",
)
def test_admin_only(admin_user: User = Depends(require_roles("ADMIN"))) -> MessageResponse:
    """Verification route restricted strictly to administrators."""
    return MessageResponse(message="Admin access granted")
