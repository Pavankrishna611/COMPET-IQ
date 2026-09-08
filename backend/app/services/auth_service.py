"""Authentication and user management business logic."""

import logging
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import UserRegister


class AuthService:
    """Service handling user registration and credential authentication."""

    @staticmethod
    def register_public_user(db: Session, user_in: UserRegister) -> User:
        """Register a new public user with strictly enforced LEARNER role and password confirmation."""
        # 1. Validate confirm_password is provided and matches password
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

        # 2. Public users must never be able to register as ADMIN or TRAINER
        if user_in.role_id:
            role = db.query(Role).filter(Role.id == user_in.role_id).first()
            if role and role.name.upper() in ["ADMIN", "TRAINER"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Public registration cannot assign administrative or trainer roles.",
                )

        # 3. Check if email is already registered (case-insensitive)
        normalized_email = user_in.email.strip().lower()
        existing_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        # 4. Public registration must always create/assign the existing LEARNER role
        learner_role = db.query(Role).filter(Role.name == "LEARNER").first()
        if not learner_role:
            learner_role = Role(name="LEARNER", description="Standard learner persona.")
            db.add(learner_role)
            db.flush()

        # 5. Handle official_id (auto-generate if not provided)
        official_id = user_in.official_id
        if official_id:
            existing_official_id = db.query(User).filter(User.official_id == official_id).first()
            if existing_official_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this official ID already exists.",
                )
        else:
            import uuid
            while True:
                candidate_id = f"LRN-{uuid.uuid4().hex[:8].upper()}"
                if not db.query(User).filter(User.official_id == candidate_id).first():
                    official_id = candidate_id
                    break

        # 6. Securely hash password
        hashed_pwd = hash_password(user_in.password)

        # 7. Create user record with LEARNER role and safe attributes
        new_user = User(
            official_id=official_id,
            email=normalized_email,
            full_name=user_in.full_name.strip(),
            phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
            password_hash=hashed_pwd,
            designation=user_in.designation or "Learner",
            experience_years=user_in.experience_years or 0.0,
            is_active=True,
            role_id=learner_role.id,
            department_id=user_in.department_id,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def register_user(db: Session, user_in: UserRegister) -> User:
        """Register a new user after verifying uniqueness and relationships."""
        # Check if email is already registered
        normalized_email = user_in.email.strip().lower()
        existing_email = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        # Handle official_id
        official_id = user_in.official_id
        if official_id:
            existing_official_id = db.query(User).filter(User.official_id == official_id).first()
            if existing_official_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user with this official ID already exists.",
                )
        else:
            import uuid
            while True:
                candidate_id = f"LRN-{uuid.uuid4().hex[:8].upper()}"
                if not db.query(User).filter(User.official_id == candidate_id).first():
                    official_id = candidate_id
                    break

        # Validate role_id if provided; if not, default to LEARNER
        role_id = user_in.role_id
        if role_id:
            role = db.query(Role).filter(Role.id == role_id).first()
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Role with ID '{role_id}' not found.",
                )
        else:
            learner_role = db.query(Role).filter(Role.name == "LEARNER").first()
            if not learner_role:
                learner_role = Role(name="LEARNER", description="Standard learner persona.")
                db.add(learner_role)
                db.flush()
            role_id = learner_role.id

        # Validate department_id if provided
        if user_in.department_id:
            dept = db.query(Department).filter(Department.id == user_in.department_id).first()
            if not dept:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Department with ID '{user_in.department_id}' not found.",
                )

        # Hash password securely
        hashed_pwd = hash_password(user_in.password)

        # Create user record
        new_user = User(
            official_id=official_id,
            email=normalized_email,
            full_name=user_in.full_name.strip(),
            phone_number=user_in.phone_number.strip() if user_in.phone_number else None,
            password_hash=hashed_pwd,
            designation=user_in.designation,
            experience_years=user_in.experience_years,
            is_active=True,
            role_id=role_id,
            department_id=user_in.department_id,
        )

        db.add(new_user)
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


auth_service = AuthService()
