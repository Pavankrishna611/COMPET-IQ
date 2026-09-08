"""User Skill Declaration Service."""

import logging
from typing import Dict, List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.competency import Competency
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration
from app.schemas.onboarding import (
    BulkSkillDeclarationRequest,
    SkillDeclarationResponse,
    SkillDeclarationUpdate,
)

logger = logging.getLogger("competiq.services.skill_declaration")


class SkillDeclarationService:
    """Service handling self-declared skills during onboarding."""

    @staticmethod
    def declare_skills_bulk(
        db: Session,
        user: User,
        bulk_in: BulkSkillDeclarationRequest,
    ) -> List[SkillDeclarationResponse]:
        """Submit multiple self-assessed skill declarations in bulk."""
        if not bulk_in.skills:
            return []

        # 1. Prevent duplicate competency IDs within the same request
        submitted_comp_ids = [s.competency_id for s in bulk_in.skills]
        if len(submitted_comp_ids) != len(set(submitted_comp_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate competency IDs found in declaration request.",
            )

        # 2. Validate all competencies exist in database
        competencies = (
            db.query(Competency)
            .filter(Competency.id.in_(submitted_comp_ids))
            .all()
        )
        comp_map = {c.id: c for c in competencies}

        for c_id in submitted_comp_ids:
            if c_id not in comp_map:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Competency with ID '{c_id}' not found.",
                )

        # 3. Fetch existing declarations for this user and requested competencies
        existing_decls = (
            db.query(UserSkillDeclaration)
            .filter(
                UserSkillDeclaration.user_id == user.id,
                UserSkillDeclaration.competency_id.in_(submitted_comp_ids),
            )
            .all()
        )
        existing_map = {d.competency_id: d for d in existing_decls}

        # 4. Upsert declarations safely
        affected_decls: List[UserSkillDeclaration] = []
        for item in bulk_in.skills:
            clean_confidence = item.confidence_level.upper().strip()
            exp_years = item.years_of_experience if item.years_of_experience is not None else 0.0

            if item.competency_id in existing_map:
                decl = existing_map[item.competency_id]
                decl.self_assessed_level = item.self_assessed_level
                decl.confidence_level = clean_confidence
                decl.years_of_experience = exp_years
                decl.last_used = item.last_used
                decl.source = "SELF_DECLARED"
                affected_decls.append(decl)
            else:
                decl = UserSkillDeclaration(
                    user_id=user.id,
                    competency_id=item.competency_id,
                    self_assessed_level=item.self_assessed_level,
                    confidence_level=clean_confidence,
                    years_of_experience=exp_years,
                    last_used=item.last_used,
                    source="SELF_DECLARED",
                )
                db.add(decl)
                affected_decls.append(decl)

        # 5. Update UserProfile onboarding state
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if profile:
            profile.skills_completed = True
            if not profile.competency_initialized:
                profile.onboarding_step = 3
        else:
            # If no profile exists yet, create one to track onboarding state
            profile = UserProfile(
                user_id=user.id,
                skills_completed=True,
                profile_completed=False,
                onboarding_step=3,
            )
            db.add(profile)

        db.commit()

        # Re-fetch or refresh to have IDs and timestamps populated
        for d in affected_decls:
            db.refresh(d)

        # Build response list ordered by competency name
        responses: List[SkillDeclarationResponse] = []
        for decl in affected_decls:
            comp = comp_map[decl.competency_id]
            responses.append(
                SkillDeclarationResponse(
                    id=decl.id,
                    competency_id=decl.competency_id,
                    competency_name=comp.name,
                    competency_code=comp.code,
                    competency_domain=comp.domain,
                    domain=comp.domain,
                    category=comp.category,
                    self_assessed_level=decl.self_assessed_level,
                    confidence_level=decl.confidence_level,
                    years_of_experience=decl.years_of_experience,
                    last_used=decl.last_used,
                    source=decl.source,
                    created_at=decl.created_at,
                    updated_at=decl.updated_at,
                )
            )

        responses.sort(key=lambda r: r.competency_name.lower())
        logger.info(f"User {user.id} declared {len(responses)} skills successfully.")
        return responses

    @staticmethod
    def get_my_skills(db: Session, user: User) -> List[SkillDeclarationResponse]:
        """Fetch all declared skills for the authenticated user, ordered consistently."""
        declarations = (
            db.query(UserSkillDeclaration)
            .join(Competency, UserSkillDeclaration.competency_id == Competency.id)
            .filter(UserSkillDeclaration.user_id == user.id)
            .order_by(Competency.name.asc())
            .all()
        )

        responses: List[SkillDeclarationResponse] = []
        for decl in declarations:
            comp = decl.competency
            responses.append(
                SkillDeclarationResponse(
                    id=decl.id,
                    competency_id=decl.competency_id,
                    competency_name=comp.name if comp else "",
                    competency_code=comp.code if comp else "",
                    competency_domain=comp.domain if comp else None,
                    domain=comp.domain if comp else None,
                    category=comp.category if comp else None,
                    self_assessed_level=decl.self_assessed_level,
                    confidence_level=decl.confidence_level,
                    years_of_experience=decl.years_of_experience or 0.0,
                    last_used=decl.last_used,
                    source=decl.source,
                    created_at=decl.created_at,
                    updated_at=decl.updated_at,
                )
            )
        return responses

    @staticmethod
    def update_skill_declaration(
        db: Session,
        user: User,
        competency_id: UUID,
        update_in: SkillDeclarationUpdate,
    ) -> SkillDeclarationResponse:
        """Update an existing self-declared skill for the authenticated user."""
        # 1. Verify competency exists
        comp = db.query(Competency).filter(Competency.id == competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency with ID '{competency_id}' not found.",
            )

        # 2. Find user's declaration
        decl = (
            db.query(UserSkillDeclaration)
            .filter(
                UserSkillDeclaration.user_id == user.id,
                UserSkillDeclaration.competency_id == competency_id,
            )
            .first()
        )
        if not decl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill declaration for competency '{comp.name}' not found for this user.",
            )

        # 3. Update allowed fields only
        if update_in.self_assessed_level is not None:
            decl.self_assessed_level = update_in.self_assessed_level
        if update_in.confidence_level is not None:
            decl.confidence_level = update_in.confidence_level.upper().strip()
        if update_in.years_of_experience is not None:
            decl.years_of_experience = update_in.years_of_experience
        if update_in.last_used is not None:
            decl.last_used = update_in.last_used

        db.commit()
        db.refresh(decl)

        logger.info(f"User {user.id} updated declaration for competency {competency_id}.")
        return SkillDeclarationResponse(
            id=decl.id,
            competency_id=decl.competency_id,
            competency_name=comp.name,
            competency_code=comp.code,
            competency_domain=comp.domain,
            domain=comp.domain,
            category=comp.category,
            self_assessed_level=decl.self_assessed_level,
            confidence_level=decl.confidence_level,
            years_of_experience=decl.years_of_experience or 0.0,
            last_used=decl.last_used,
            source=decl.source,
            created_at=decl.created_at,
            updated_at=decl.updated_at,
        )

    @staticmethod
    def delete_skill_declaration(
        db: Session,
        user: User,
        competency_id: UUID,
    ) -> Dict[str, str]:
        """Delete a self-declared skill for the authenticated user."""
        decl = (
            db.query(UserSkillDeclaration)
            .filter(
                UserSkillDeclaration.user_id == user.id,
                UserSkillDeclaration.competency_id == competency_id,
            )
            .first()
        )
        if not decl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill declaration not found.",
            )

        db.delete(decl)
        db.flush()

        # Check if user has any remaining declared skills
        remaining_count = (
            db.query(UserSkillDeclaration)
            .filter(UserSkillDeclaration.user_id == user.id)
            .count()
        )

        if remaining_count == 0:
            profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            if profile:
                profile.skills_completed = False
                # If competency_initialized is not yet true, roll step back appropriately
                if not profile.competency_initialized:
                    profile.onboarding_step = 2 if profile.profile_completed else 1

        db.commit()
        logger.info(f"User {user.id} deleted declaration for competency {competency_id}.")
        return {"message": "Skill declaration deleted successfully"}


skill_declaration_service = SkillDeclarationService()
