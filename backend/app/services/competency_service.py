"""Competency management and user proficiency database services."""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.competency import Competency
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user_competency import UserCompetency
from app.schemas.competency import (
    CompetencyCreate,
    CompetencyUpdate,
    RoleCompetencyRequirementCreate,
    RoleCompetencyRequirementUpdate,
    UserCompetencyCreate,
    UserCompetencyUpdate,
)
from app.schemas.onboarding import (
    AvailableCompetenciesResponse,
    CompetencyDomainGroup,
    CompetencyOption,
)


class CompetencyService:
    """Service handling all database operations for competencies, user profiles, and role requirements."""

    # -------------------------------------------------------------------------
    # Competency Catalog Operations
    # -------------------------------------------------------------------------
    @staticmethod
    def get_all_competencies(
        db: Session,
        domain: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Competency]:
        """Fetch all competencies with optional filtering by domain, category, or search query."""
        query = db.query(Competency)
        if domain:
            query = query.filter(Competency.domain.ilike(f"%{domain}%"))
        if category:
            query = query.filter(Competency.category.ilike(f"%{category}%"))
        if search:
            query = query.filter(
                or_(
                    Competency.name.ilike(f"%{search}%"),
                    Competency.code.ilike(f"%{search}%"),
                    Competency.description.ilike(f"%{search}%"),
                )
            )
        return query.order_by(Competency.name.asc()).all()

    @staticmethod
    def get_available_competencies_grouped(db: Session) -> AvailableCompetenciesResponse:
        """Fetch all available competencies grouped by domain for onboarding."""
        competencies = db.query(Competency).order_by(Competency.name.asc()).all()
        if not competencies:
            return AvailableCompetenciesResponse(domains=[])

        # Domain normalization map
        domain_name_map = {
            "STATISTICAL METHODS": "STATISTICAL",
            "STATISTICAL": "STATISTICAL",
            "STATISTICS": "STATISTICAL",
            "TECHNICAL": "TECHNICAL",
            "TECH": "TECHNICAL",
            "DIGITAL GOVERNANCE": "DIGITAL_GOVERNANCE",
            "DIGITAL_GOVERNANCE": "DIGITAL_GOVERNANCE",
            "BEHAVIOURAL": "BEHAVIOURAL",
            "BEHAVIORAL": "BEHAVIOURAL",
        }

        # Canonical ordering of domains
        canonical_order = ["STATISTICAL", "TECHNICAL", "DIGITAL_GOVERNANCE", "BEHAVIOURAL"]

        # Group competencies by normalized domain
        domain_groups_dict: Dict[str, List[CompetencyOption]] = {}
        for comp in competencies:
            raw_domain = comp.domain.strip() if comp.domain else "OTHER"
            normalized_domain = domain_name_map.get(raw_domain.upper(), raw_domain.upper().replace(" ", "_"))

            if normalized_domain not in domain_groups_dict:
                domain_groups_dict[normalized_domain] = []

            domain_groups_dict[normalized_domain].append(
                CompetencyOption(
                    id=comp.id,
                    name=comp.name,
                    description=comp.description,
                    domain=normalized_domain,
                )
            )

        # Sort domain groups according to canonical order, followed by alphabetical for any extras
        ordered_domains = sorted(
            domain_groups_dict.keys(),
            key=lambda d: (canonical_order.index(d) if d in canonical_order else 99, d),
        )

        domain_groups = []
        for domain_key in ordered_domains:
            # Competencies sorted alphabetically by name
            sorted_comps = sorted(domain_groups_dict[domain_key], key=lambda c: c.name.lower())
            domain_groups.append(
                CompetencyDomainGroup(
                    domain=domain_key,
                    competencies=sorted_comps,
                )
            )

        return AvailableCompetenciesResponse(domains=domain_groups)

    @staticmethod
    def get_competency(db: Session, competency_id: UUID) -> Competency:
        """Fetch a single competency by its UUID or raise 404."""
        comp = db.query(Competency).filter(Competency.id == competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency with ID '{competency_id}' not found.",
            )
        return comp

    @staticmethod
    def create_competency(db: Session, comp_in: CompetencyCreate) -> Competency:
        """Create a new competency after validating uniqueness of the competency code."""
        existing = db.query(Competency).filter(Competency.code == comp_in.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A competency with code '{comp_in.code}' already exists.",
            )

        new_comp = Competency(
            name=comp_in.name,
            code=comp_in.code,
            description=comp_in.description,
            domain=comp_in.domain,
            category=comp_in.category,
        )
        db.add(new_comp)
        db.commit()
        db.refresh(new_comp)
        return new_comp

    @staticmethod
    def update_competency(
        db: Session,
        competency_id: UUID,
        update_in: CompetencyUpdate,
    ) -> Competency:
        """Update fields of an existing competency."""
        comp = db.query(Competency).filter(Competency.id == competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency with ID '{competency_id}' not found.",
            )

        if update_in.name is not None:
            comp.name = update_in.name
        if update_in.description is not None:
            comp.description = update_in.description
        if update_in.domain is not None:
            comp.domain = update_in.domain
        if update_in.category is not None:
            comp.category = update_in.category

        db.commit()
        db.refresh(comp)
        return comp

    @staticmethod
    def delete_competency(db: Session, competency_id: UUID) -> bool:
        """Delete a competency and its associated evaluations/requirements safely."""
        comp = db.query(Competency).filter(Competency.id == competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency with ID '{competency_id}' not found.",
            )

        db.delete(comp)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # User Competency Profile Operations
    # -------------------------------------------------------------------------
    @staticmethod
    def get_user_competencies(db: Session, user_id: UUID) -> List[UserCompetency]:
        """Fetch all assessed competency records for a specific user with eager loaded metadata."""
        return (
            db.query(UserCompetency)
            .options(joinedload(UserCompetency.competency))
            .filter(UserCompetency.user_id == user_id)
            .order_by(UserCompetency.current_level.desc())
            .all()
        )

    @staticmethod
    def create_user_competency(
        db: Session,
        user_id: UUID,
        create_in: UserCompetencyCreate,
    ) -> UserCompetency:
        """Assign or initialize a competency evaluation for a user."""
        # Verify competency exists
        comp = db.query(Competency).filter(Competency.id == create_in.competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency with ID '{create_in.competency_id}' does not exist.",
            )

        # Check for duplicate evaluation
        existing = (
            db.query(UserCompetency)
            .filter(
                UserCompetency.user_id == user_id,
                UserCompetency.competency_id == create_in.competency_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Competency '{comp.name}' is already assigned to this user. Use update instead.",
            )

        user_comp = UserCompetency(
            user_id=user_id,
            competency_id=create_in.competency_id,
            current_level=create_in.current_level,
            confidence_score=create_in.confidence_score,
            last_assessed_at=datetime.now(timezone.utc),
        )
        db.add(user_comp)
        db.commit()
        db.refresh(user_comp)
        return user_comp

    @staticmethod
    def update_user_competency(
        db: Session,
        user_id: UUID,
        competency_id: UUID,
        update_in: UserCompetencyUpdate,
    ) -> UserCompetency:
        """Update an existing competency evaluation for a user."""
        user_comp = (
            db.query(UserCompetency)
            .options(joinedload(UserCompetency.competency))
            .filter(
                UserCompetency.user_id == user_id,
                UserCompetency.competency_id == competency_id,
            )
            .first()
        )
        if not user_comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency evaluation for ID '{competency_id}' not found for this user.",
            )

        if update_in.current_level is not None:
            user_comp.current_level = update_in.current_level
        if update_in.confidence_score is not None:
            user_comp.confidence_score = update_in.confidence_score

        user_comp.last_assessed_at = update_in.last_assessed_at or datetime.now(timezone.utc)
        db.commit()
        db.refresh(user_comp)
        return user_comp

    @staticmethod
    def delete_user_competency(db: Session, user_id: UUID, competency_id: UUID) -> bool:
        """Remove a competency from a user's competency profile."""
        user_comp = (
            db.query(UserCompetency)
            .filter(
                UserCompetency.user_id == user_id,
                UserCompetency.competency_id == competency_id,
            )
            .first()
        )
        if not user_comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency evaluation for ID '{competency_id}' not found for this user.",
            )

        db.delete(user_comp)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # Role Competency Requirements Operations
    # -------------------------------------------------------------------------
    @staticmethod
    def get_role_requirements(
        db: Session,
        role_id: Optional[UUID] = None,
    ) -> List[RoleCompetencyRequirement]:
        """Fetch all role competency benchmarks, optionally filtered by role_id."""
        query = (
            db.query(RoleCompetencyRequirement)
            .options(
                joinedload(RoleCompetencyRequirement.role),
                joinedload(RoleCompetencyRequirement.competency),
            )
        )
        if role_id:
            query = query.filter(RoleCompetencyRequirement.role_id == role_id)
        return query.order_by(RoleCompetencyRequirement.required_level.desc()).all()

    @staticmethod
    def create_role_requirement(
        db: Session,
        create_in: RoleCompetencyRequirementCreate,
    ) -> RoleCompetencyRequirement:
        """Create a target competency benchmark requirement for a specific role."""
        # Validate role
        role = db.query(Role).filter(Role.id == create_in.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID '{create_in.role_id}' not found.",
            )

        # Validate competency
        comp = db.query(Competency).filter(Competency.id == create_in.competency_id).first()
        if not comp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency with ID '{create_in.competency_id}' not found.",
            )

        # Check unique constraint
        existing = (
            db.query(RoleCompetencyRequirement)
            .filter(
                RoleCompetencyRequirement.role_id == create_in.role_id,
                RoleCompetencyRequirement.competency_id == create_in.competency_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Requirement for competency '{comp.name}' already defined for role '{role.name}'.",
            )

        req = RoleCompetencyRequirement(
            role_id=create_in.role_id,
            competency_id=create_in.competency_id,
            required_level=create_in.required_level,
            priority=create_in.priority.upper(),
        )
        db.add(req)
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def update_role_requirement(
        db: Session,
        requirement_id: UUID,
        update_in: RoleCompetencyRequirementUpdate,
    ) -> RoleCompetencyRequirement:
        """Update required level or priority on a role competency requirement."""
        req = (
            db.query(RoleCompetencyRequirement)
            .options(
                joinedload(RoleCompetencyRequirement.role),
                joinedload(RoleCompetencyRequirement.competency),
            )
            .filter(RoleCompetencyRequirement.id == requirement_id)
            .first()
        )
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role requirement with ID '{requirement_id}' not found.",
            )

        if update_in.required_level is not None:
            req.required_level = update_in.required_level
        if update_in.priority is not None:
            req.priority = update_in.priority.upper()

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def delete_role_requirement(db: Session, requirement_id: UUID) -> bool:
        """Delete a role competency requirement."""
        req = db.query(RoleCompetencyRequirement).filter(RoleCompetencyRequirement.id == requirement_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role requirement with ID '{requirement_id}' not found.",
            )

        db.delete(req)
        db.commit()
        return True


competency_service = CompetencyService()
