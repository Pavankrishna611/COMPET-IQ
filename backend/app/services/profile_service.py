"""Professional Profile and Employment Information Service."""

import logging
import uuid
from typing import Optional, Union

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.onboarding import OnboardingStatusResponse, ProfileCreate, ProfileUpdate

logger = logging.getLogger("competiq.services.profile")


class ProfileService:
    """Business logic for user professional profile management."""

    @staticmethod
    def _parse_experience(exp_years_val: Optional[float], exp_alias: Optional[Union[float, str]]) -> float:
        if exp_years_val is not None and exp_years_val > 0.0:
            return float(exp_years_val)
        if exp_alias is not None:
            if isinstance(exp_alias, (int, float)):
                return float(exp_alias)
            if isinstance(exp_alias, str):
                s = exp_alias.strip()
                mapping = {
                    "Fresher": 0.0,
                    "0–1 years": 0.5,
                    "0-1 years": 0.5,
                    "1–3 years": 2.0,
                    "1-3 years": 2.0,
                    "3–5 years": 4.0,
                    "3-5 years": 4.0,
                    "5+ years": 6.0,
                }
                return mapping.get(s, 0.0)
        return float(exp_years_val or 0.0)

    @classmethod
    def create_profile(cls, db: Session, user: User, profile_in: ProfileCreate) -> UserProfile:
        """Create the authenticated user's professional profile, preventing duplicates."""
        # 1. Prevent duplicate profile creation
        existing = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists for this user. Use PUT /onboarding/profile/me to update your profile.",
            )

        # 2. Validate department_id if provided or link/create from department name
        dept_id = None
        if profile_in.department_id is not None:
            dept = db.query(Department).filter(Department.id == profile_in.department_id).first()
            if not dept:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Department with ID '{profile_in.department_id}' not found.",
                )
            dept_id = dept.id
        elif profile_in.department and profile_in.department.strip():
            dept_name = profile_in.department.strip()
            dept = db.query(Department).filter(Department.name.ilike(dept_name)).first()
            if not dept:
                code = "".join([w[0] for w in dept_name.split() if w])[:8].upper() or "DEPT"
                existing_code = db.query(Department).filter(Department.code == code).first()
                if existing_code:
                    code = f"{code[:5]}_{uuid.uuid4().hex[:2].upper()}"
                dept = Department(name=dept_name, code=code, description=dept_name)
                db.add(dept)
                db.flush()
            dept_id = dept.id

        # 3. Check required fields for profile completion:
        clean_designation = profile_in.designation.strip() if profile_in.designation else None
        clean_job_role = profile_in.job_role.strip() if profile_in.job_role else None
        clean_assignment = profile_in.current_assignment.strip() if profile_in.current_assignment else None
        clean_employment = profile_in.employment_type.strip() if profile_in.employment_type else "GOVERNMENT_OFFICER"
        clean_education = (profile_in.education or profile_in.education_level or "BACHELORS").strip()
        exp_years = cls._parse_experience(profile_in.experience_years, profile_in.experience)
        clean_work_area = (
            profile_in.current_work_area.strip()
            if profile_in.current_work_area
            else (profile_in.department.strip() if profile_in.department else None)
        )
        clean_trainings = profile_in.previous_trainings.strip() if profile_in.previous_trainings else None
        clean_goal = (profile_in.professional_goal or profile_in.career_goal or "").strip() or None

        is_completed = bool(
            clean_designation
            and clean_employment
            and exp_years is not None
            and clean_education
        )

        onboarding_step = 2 if is_completed else 1

        profile = UserProfile(
            user_id=user.id,
            department_id=dept_id,
            designation=clean_designation,
            employment_type=clean_employment,
            experience_years=exp_years,
            education_level=clean_education,
            specialization=profile_in.specialization.strip() if profile_in.specialization else None,
            current_work_area=clean_work_area,
            job_role=clean_job_role,
            current_assignment=clean_assignment,
            previous_trainings=clean_trainings,
            professional_goal=clean_goal,
            location=profile_in.location.strip() if profile_in.location else None,
            bio=profile_in.bio.strip() if profile_in.bio else None,
            profile_completed=is_completed,
            skills_completed=False,
            competency_initialized=False,
            onboarding_completed=False,
            onboarding_step=onboarding_step,
        )

        db.add(profile)

        # Synchronize core user attributes
        if clean_designation:
            user.designation = clean_designation
        if exp_years:
            user.experience_years = exp_years
        if dept_id:
            user.department_id = dept_id

        db.commit()
        db.refresh(profile)
        db.refresh(user)
        logger.info(f"Created professional profile for user {user.id} (completed: {is_completed})")
        return profile

    @staticmethod
    def get_profile_by_user(db: Session, user: User) -> UserProfile:
        """Fetch the authenticated user's profile or return 404."""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Please create your profile first.",
            )
        return profile

    @staticmethod
    def get_or_create_profile(db: Session, user: User) -> UserProfile:
        """Fetch existing user profile or initialize a draft container for the user."""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            profile = UserProfile(
                user_id=user.id,
                department_id=user.department_id,
                designation=user.designation,
                experience_years=user.experience_years,
                employment_type="GOVERNMENT_OFFICER",
                education_level="BACHELORS",
                onboarding_step=1,
                profile_completed=False,
                skills_completed=False,
                competency_initialized=False,
                onboarding_completed=False,
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            logger.info(f"Initialized draft UserProfile for user {user.id}")
        return profile

    @classmethod
    def update_profile(
        cls,
        db: Session,
        user: User,
        profile_in: Union[ProfileCreate, ProfileUpdate],
    ) -> UserProfile:
        """Update existing user professional details and synchronize core user attributes."""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Please create your profile first.",
            )

        # Validate department relationship if supplied
        if profile_in.department_id is not None:
            dept = db.query(Department).filter(Department.id == profile_in.department_id).first()
            if not dept:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Department with ID '{profile_in.department_id}' not found.",
                )
            profile.department_id = dept.id
            user.department_id = dept.id
        elif profile_in.department and profile_in.department.strip():
            dept_name = profile_in.department.strip()
            dept = db.query(Department).filter(Department.name.ilike(dept_name)).first()
            if not dept:
                code = "".join([w[0] for w in dept_name.split() if w])[:8].upper() or "DEPT"
                existing_code = db.query(Department).filter(Department.code == code).first()
                if existing_code:
                    code = f"{code[:5]}_{uuid.uuid4().hex[:2].upper()}"
                dept = Department(name=dept_name, code=code, description=dept_name)
                db.add(dept)
                db.flush()
            profile.department_id = dept.id
            user.department_id = dept.id

        # Update designation and synchronize onto User model for role matching
        if profile_in.designation is not None:
            clean_designation = profile_in.designation.strip()
            profile.designation = clean_designation
            user.designation = clean_designation

        # Update job role
        if profile_in.job_role is not None:
            profile.job_role = profile_in.job_role.strip() if profile_in.job_role else None

        # Update current assignment
        if profile_in.current_assignment is not None:
            profile.current_assignment = profile_in.current_assignment.strip() if profile_in.current_assignment else None

        # Update experience
        if profile_in.experience_years is not None or profile_in.experience is not None:
            exp_val = cls._parse_experience(profile_in.experience_years, profile_in.experience)
            profile.experience_years = exp_val
            user.experience_years = exp_val

        # Update employment and education details
        if profile_in.employment_type is not None:
            profile.employment_type = profile_in.employment_type.strip()

        if profile_in.education is not None or profile_in.education_level is not None:
            edu_val = profile_in.education or profile_in.education_level
            profile.education_level = edu_val.strip() if edu_val else "BACHELORS"

        if profile_in.specialization is not None:
            profile.specialization = profile_in.specialization.strip() if profile_in.specialization else None

        if profile_in.current_work_area is not None:
            profile.current_work_area = profile_in.current_work_area.strip() if profile_in.current_work_area else None

        if profile_in.previous_trainings is not None:
            profile.previous_trainings = profile_in.previous_trainings.strip() if profile_in.previous_trainings else None

        if profile_in.professional_goal is not None or profile_in.career_goal is not None:
            goal_val = profile_in.professional_goal or profile_in.career_goal
            profile.professional_goal = goal_val.strip() if goal_val else None

        if profile_in.location is not None:
            profile.location = profile_in.location.strip() if profile_in.location else None

        if profile_in.bio is not None:
            profile.bio = profile_in.bio.strip() if profile_in.bio else None

        # Recalculate profile_completed if all required fields are present
        # Required fields: designation, employment_type, experience_years, education_level
        is_completed = bool(
            profile.designation
            and profile.designation.strip()
            and profile.employment_type
            and profile.employment_type.strip()
            and profile.experience_years is not None
            and profile.education_level
            and profile.education_level.strip()
        )
        profile.profile_completed = is_completed

        # Advance onboarding_step if completed, preserving any further steps
        if is_completed and profile.onboarding_step < 2:
            profile.onboarding_step = 2

        # Preserves skills_completed and onboarding_completed
        db.commit()
        db.refresh(profile)
        db.refresh(user)
        logger.info(f"Updated professional profile for user {user.id} (completed: {profile.profile_completed})")
        return profile

    @staticmethod
    def get_onboarding_status(db: Session, user: User) -> OnboardingStatusResponse:
        """Calculate and return the authenticated user's current onboarding step and next action."""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

        # Case 1: No UserProfile exists
        if not profile:
            return OnboardingStatusResponse(
                current_step=1,
                profile_completed=False,
                skills_completed=False,
                competency_initialized=False,
                onboarding_completed=False,
                next_action="Complete your professional profile",
            )

        profile_completed = bool(profile.profile_completed)
        skills_completed = bool(profile.skills_completed)
        competency_initialized = bool(getattr(profile, "competency_initialized", False))
        onboarding_completed = bool(profile.onboarding_completed)

        # Case 6: Onboarding completed
        if onboarding_completed:
            current_step = 5
            next_action = "Go to your COMPETIQ dashboard"
        # Case 5: Competencies initialized but onboarding not completed
        elif competency_initialized:
            current_step = 4
            next_action = "Review your competency profile and complete onboarding"
        # Case 4: Skills declared/completed but competencies not initialized
        elif skills_completed:
            current_step = 3
            next_action = "Initialize your competency profile"
        # Case 3: Profile completed but skills not declared
        elif profile_completed:
            current_step = 2
            next_action = "Declare your current skills"
        # Case 2: Profile exists but profile_completed is false
        else:
            current_step = 1
            next_action = "Complete your professional profile"

        return OnboardingStatusResponse(
            current_step=current_step,
            profile_completed=profile_completed,
            skills_completed=skills_completed,
            competency_initialized=competency_initialized,
            onboarding_completed=onboarding_completed,
            next_action=next_action,
        )

    @staticmethod
    def complete_onboarding(db: Session, user: User) -> OnboardingStatusResponse:
        """Mark the authenticated learner's onboarding as completed."""
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if profile:
            profile.onboarding_completed = True
            profile.onboarding_step = 5
            db.commit()
            db.refresh(profile)
            logger.info(f"Marked onboarding completed for user {user.id}")
        return ProfileService.get_onboarding_status(db, user)


profile_service = ProfileService()
