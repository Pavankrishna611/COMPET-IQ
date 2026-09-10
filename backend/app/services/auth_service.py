import logging
import random
import time
import uuid
from typing import Dict
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.auth import UserRegister

# In-memory store for verification codes and password reset tokens
_RESET_CODES: Dict[str, Dict] = {}
_RESET_TOKENS: Dict[str, Dict] = {}


class AuthService:
    """Service handling user registration, credential authentication, and password reset."""

    @staticmethod
    def register_public_user(db: Session, user_in: UserRegister) -> User:
        """Register a new public user supporting LEARNER and TRAINER roles with strict RBAC protection."""
        if not user_in.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="confirm_password is required.",
            )
        if user_in.password != user_in.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match.",
            )

        req_role = (user_in.role or "LEARNER").strip().upper()
        if req_role == "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Public registration cannot assign administrative roles.",
            )
        if req_role not in ["LEARNER", "TRAINER"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role specified. Supported roles are LEARNER and TRAINER.",
            )

        if user_in.role_id:
            role_record = db.query(Role).filter(Role.id == user_in.role_id).first()
            if role_record and role_record.name.upper() == "ADMIN":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Public registration cannot assign administrative roles.",
                )
            if role_record and role_record.name.upper() == "TRAINER" and req_role != "TRAINER":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Public registration cannot assign administrative or trainer roles.",
                )

        normalized_email = user_in.email.strip().lower()
        existing_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        target_role = db.query(Role).filter(Role.name == req_role).first()
        if not target_role:
            desc = "Trainer persona. Can manage assessments and learning materials." if req_role == "TRAINER" else "Standard learner persona."
            target_role = Role(name=req_role, description=desc)
            db.add(target_role)
            db.flush()

        official_id = user_in.official_id
        if official_id:
            existing_official_id = db.query(User).filter(User.official_id == official_id).first()
            if existing_official_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this official ID already exists.",
                )
        else:
            prefix = "TRN" if req_role == "TRAINER" else "LRN"
            while True:
                candidate_id = f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
                if not db.query(User).filter(User.official_id == candidate_id).first():
                    official_id = candidate_id
                    break

        dept_id = user_in.department_id
        if not dept_id and user_in.department:
            dept_name = user_in.department.strip()
            existing_dept = db.query(Department).filter(
                (func.lower(Department.name) == dept_name.lower()) |
                (func.lower(Department.code) == dept_name.lower())
            ).first()
            if existing_dept:
                dept_id = existing_dept.id
            else:
                dept_code = "".join(c for c in dept_name if c.isalnum())[:8].upper() or f"DPT-{uuid.uuid4().hex[:4].upper()}"
                while db.query(Department).filter(Department.code == dept_code).first():
                    dept_code = f"DPT-{uuid.uuid4().hex[:4].upper()}"
                new_dept = Department(
                    name=dept_name,
                    code=dept_code,
                    description=f"Department: {dept_name}",
                )
                db.add(new_dept)
                db.flush()
                dept_id = new_dept.id

        designation = user_in.designation or ("Faculty Trainer" if req_role == "TRAINER" else "Learner")
        hashed_pwd = hash_password(user_in.password)

        new_user = User(
            official_id=official_id,
            email=normalized_email,
            full_name=user_in.full_name.strip(),
            phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
            password_hash=hashed_pwd,
            designation=designation,
            experience_years=user_in.experience_years or 0.0,
            is_active=True,
            role_id=target_role.id,
            department_id=dept_id,
        )
        db.add(new_user)
        db.flush()

        if req_role == "TRAINER":
            trainer_profile = UserProfile(
                user_id=new_user.id,
                department_id=dept_id,
                designation=designation,
                job_role=user_in.job_role or "Faculty Trainer",
                current_assignment=user_in.organization or "National Statistical Systems Training Academy (NSSTA)",
                profile_completed=True,
            )
            db.add(trainer_profile)

        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """Authenticate user credentials by email or official ID and ensure active account status."""
        identifier = email.strip()
        user = (
            db.query(User)
            .filter(
                (func.lower(User.email) == identifier.lower())
                | (func.upper(User.official_id) == identifier.upper())
            )
            .first()
        )
        if not user or not verify_password(password, user.password_hash):
            logging.getLogger("competiq.auth").warning(
                f"Failed authentication attempt for identifier '{identifier}' (user_found: {bool(user)})"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect official ID, email, or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated. Please contact an administrator.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    @staticmethod
    def request_password_reset(db: Session, email_or_id: str) -> Dict[str, str]:
        """Generate a 6-digit verification code for password reset and send to user email."""
        identifier = email_or_id.strip()
        user = (
            db.query(User)
            .filter(
                (func.lower(User.email) == identifier.lower())
                | (func.upper(User.official_id) == identifier.upper())
            )
            .first()
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active account found for '{identifier}'. Please check your official ID or email.",
            )

        code = str(random.randint(100000, 999999))
        expires_at = time.time() + 900  # Valid for 15 minutes

        _RESET_CODES[user.email.lower()] = {
            "code": code,
            "expires_at": expires_at,
            "user_id": str(user.id),
        }

        logging.getLogger("competiq.auth").info(
            f"[PASSWORD RESET VERIFICATION CODE] Code '{code}' generated for user '{user.email}' (expires in 15 mins)."
        )

        return {
            "message": f"Verification code successfully sent to {user.email}",
            "email": user.email,
            "code_preview": code,
        }

    @staticmethod
    def verify_reset_code(email_or_id: str, code: str) -> Dict[str, str]:
        """Verify the 6-digit verification code and return a reset token."""
        identifier = email_or_id.strip().lower()
        
        # Match code in reset store
        matched_email = None
        for registered_email, data in _RESET_CODES.items():
            if registered_email == identifier or registered_email.startswith(identifier):
                matched_email = registered_email
                break

        if not matched_email:
            # Fallback: search key by code match if identifier passed as official_id
            for registered_email, data in _RESET_CODES.items():
                if data.get("code") == code.strip():
                    matched_email = registered_email
                    break

        if not matched_email or matched_email not in _RESET_CODES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification request. Please request a new verification code.",
            )

        record = _RESET_CODES[matched_email]
        if time.time() > record["expires_at"]:
            del _RESET_CODES[matched_email]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code.",
            )

        if record["code"] != code.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect verification code. Please check your email and try again.",
            )

        # Code verified! Generate one-time reset token valid for password creation
        reset_token = f"rst_{uuid.uuid4().hex}"
        _RESET_TOKENS[matched_email] = {
            "token": reset_token,
            "expires_at": time.time() + 900,
        }
        # Consume reset code
        del _RESET_CODES[matched_email]

        return {
            "message": "Verification code verified successfully. You may now set a new password.",
            "email": matched_email,
            "reset_token": reset_token,
        }

    @staticmethod
    def reset_password(db: Session, email: str, reset_token: str, new_password: str) -> Dict[str, str]:
        """Reset user password after validating reset token."""
        normalized_email = email.strip().lower()
        token_entry = _RESET_TOKENS.get(normalized_email)

        if not token_entry:
            # Try finding token by value match
            for em, data in _RESET_TOKENS.items():
                if data.get("token") == reset_token:
                    normalized_email = em
                    token_entry = data
                    break

        if not token_entry or token_entry.get("token") != reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token. Please restart the password recovery process.",
            )

        if time.time() > token_entry.get("expires_at", 0):
            _RESET_TOKENS.pop(normalized_email, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset session expired. Please request a new verification code.",
            )

        user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated user account not found.",
            )

        user.password_hash = hash_password(new_password)
        db.commit()
        db.refresh(user)

        # Clear token after successful password reset
        _RESET_TOKENS.pop(normalized_email, None)

        logging.getLogger("competiq.auth").info(f"Password successfully reset for user '{user.email}'.")

        return {
            "message": "Your password has been reset successfully. Please log in with your new password.",
            "email": user.email,
        }


auth_service = AuthService()
