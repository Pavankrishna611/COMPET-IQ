"""Authentication request and response schemas."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class UserRegister(BaseModel):
    """Registration request schema with field and password complexity validation."""

    full_name: str = Field(..., min_length=1, max_length=150, description="Full name")
    email: EmailStr = Field(..., description="Valid work or personal email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (minimum 8 characters)")
    confirm_password: Optional[str] = Field(None, description="Password confirmation matching password")
    phone_number: Optional[str] = Field(None, max_length=20, description="Optional contact phone number")
    official_id: Optional[str] = Field(None, min_length=1, max_length=50, description="Government or employee identification ID")
    role: Optional[str] = Field("LEARNER", description="Requested role: LEARNER or TRAINER")
    designation: Optional[str] = Field(None, max_length=100, description="Job title / designation")
    department: Optional[str] = Field(None, max_length=150, description="Department or division name")
    organization: Optional[str] = Field(None, max_length=150, description="Organization / Institution name")
    job_role: Optional[str] = Field(None, max_length=100, description="Cadre / Job role")
    experience_years: float = Field(0.0, ge=0.0, description="Years of professional experience")
    role_id: Optional[uuid.UUID] = Field(None, description="Assigned Role UUID")
    department_id: Optional[uuid.UUID] = Field(None, description="Assigned Department UUID")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> str:
        """Ensure role is strictly LEARNER or TRAINER, blocking ADMIN attempts."""
        if v is None:
            return "LEARNER"
        normalized = v.strip().upper()
        if normalized not in ["LEARNER", "TRAINER"]:
            if normalized == "ADMIN":
                raise ValueError("Public registration cannot assign administrative roles.")
            raise ValueError("Invalid role specified. Supported roles are LEARNER and TRAINER.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        """Validate password meets minimum complexity rules: 8+ chars, 1 uppercase, 1 lowercase, 1 number."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number.")
        return v

    @model_validator(mode="after")
    def verify_password_match(self) -> "UserRegister":
        """Verify confirm_password matches password if provided."""
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserLogin(BaseModel):
    """Login request payload."""

    email: str = Field(..., description="Registered user email or official ID")
    password: str = Field(..., description="Account password")


class TokenUser(BaseModel):
    """Basic authenticated user metadata included with token response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    role: Optional[str] = None
    onboarding_completed: bool = False


class TokenResponse(BaseModel):
    """JWT bearer token response structure."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: TokenUser


class TokenPayload(BaseModel):
    """Decoded JWT claims representation."""

    sub: str
    role: Optional[str] = None
    exp: Optional[datetime] = None


class ForgotPasswordRequest(BaseModel):
    """Request payload to initiate password reset via verification code."""

    email: str = Field(..., description="Registered email address or official ID")


class ForgotPasswordVerify(BaseModel):
    """Request payload to verify the 6-digit verification code."""

    email: str = Field(..., description="Registered email address or official ID")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class ResetPasswordRequest(BaseModel):
    """Request payload to update password after code verification."""

    email: str = Field(..., description="Registered email address or official ID")
    reset_token: str = Field(..., description="Verification reset token")
    new_password: str = Field(..., min_length=8, max_length=128, description="New account password")

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number.")
        return v
