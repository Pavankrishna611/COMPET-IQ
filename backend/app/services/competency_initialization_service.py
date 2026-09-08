"""Competency Initialization Engine."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.competency import Competency
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration

logger = logging.getLogger("competiq.services.competency_initialization")


class CompetencyInitializationService:
    """Calculates conservative baseline competency ratings from user self-declarations."""

    # Base level conversion mapping:
    # 1 -> 1.0, 2 -> 1.5, 3 -> 2.5, 4 -> 3.5, 5 -> 4.0
    BASE_LEVEL_MAP: Dict[int, float] = {
        1: 1.0,
        2: 1.5,
        3: 2.5,
        4: 3.5,
        5: 4.0,
    }

    # Confidence adjustment:
    # LOW -> -0.2, MEDIUM -> 0.0, HIGH -> +0.2
    CONFIDENCE_ADJUSTMENT_MAP: Dict[str, float] = {
        "LOW": -0.2,
        "MEDIUM": 0.0,
        "HIGH": 0.2,
    }

    # Evidence confidence values:
    # LOW -> 0.45, MEDIUM -> 0.55, HIGH -> 0.65
    CONFIDENCE_SCORE_MAP: Dict[str, float] = {
        "LOW": 0.45,
        "MEDIUM": 0.55,
        "HIGH": 0.65,
    }

    @classmethod
    def calculate_base_level(cls, self_assessed_level: int) -> float:
        """Map self-assessed level (1-5) to conservative base competency (1.0 - 4.0)."""
        return cls.BASE_LEVEL_MAP.get(self_assessed_level, 1.0)

    @classmethod
    def calculate_confidence_adjustment(cls, confidence_level: Optional[str]) -> float:
        """Map confidence level to adjustment: LOW=-0.2, MEDIUM=0.0, HIGH=+0.2."""
        if not confidence_level:
            return 0.0
        return cls.CONFIDENCE_ADJUSTMENT_MAP.get(confidence_level.upper().strip(), 0.0)

    @classmethod
    def calculate_experience_adjustment(cls, years_of_experience: Optional[float] = 0.0) -> float:
        """Map years of experience to conservative adjustment (max +0.3):
        - 0 to 1 years: +0.0
        - >1 to 3 years: +0.1
        - >3 to 5 years: +0.2
        - >5 years: +0.3
        """
        if years_of_experience is None or years_of_experience <= 1.0:
            return 0.0
        elif years_of_experience <= 3.0:
            return 0.1
        elif years_of_experience <= 5.0:
            return 0.2
        else:
            return 0.3

    @classmethod
    def calculate_confidence_score(cls, confidence_level: Optional[str]) -> float:
        """Map confidence level to initial reliability score: LOW=0.45, MEDIUM=0.55, HIGH=0.65."""
        if not confidence_level:
            return 0.55
        return cls.CONFIDENCE_SCORE_MAP.get(confidence_level.upper().strip(), 0.55)

    @classmethod
    def calculate_initial_competency(
        cls,
        self_assessed_level: int,
        confidence_level: str,
        years_of_experience: float = 0.0,
    ) -> Tuple[float, float]:
        """Compute initial competency level and confidence score using conservative formula.

        Formula:
            initial_competency = base_level + confidence_adjustment + experience_adjustment
            Clamped to [0.5, 5.0], rounded to 2 decimal places.

        Returns:
            Tuple of (initial_level, confidence_score)
        """
        base = cls.calculate_base_level(self_assessed_level)
        conf_adj = cls.calculate_confidence_adjustment(confidence_level)
        exp_adj = cls.calculate_experience_adjustment(years_of_experience)

        raw = base + conf_adj + exp_adj
        clamped = max(0.5, min(5.0, raw))
        final_level = round(clamped, 2)

        conf_score = cls.calculate_confidence_score(confidence_level)
        return final_level, conf_score

    # Alias for backward compatibility
    calculate_initial_level = calculate_initial_competency

    @classmethod
    def initialize_user_competencies(
        cls,
        db: Session,
        user: User,
    ) -> Dict[str, Any]:
        """Translate self-declared skills into initial UserCompetency records without overwriting existing data.

        Critical Rule:
            Before initializing, check whether UserCompetency already exists.
            If it exists, do NOT overwrite it. Only initialize missing competencies.

        Returns:
            Structured dictionary with 'created' and 'skipped' lists.
        """
        declarations = (
            db.query(UserSkillDeclaration)
            .filter(UserSkillDeclaration.user_id == user.id)
            .all()
        )

        created: List[Dict[str, Any]] = []
        skipped: List[Dict[str, Any]] = []
        now = datetime.now(timezone.utc)

        for decl in declarations:
            comp = db.query(Competency).filter(Competency.id == decl.competency_id).first()
            if not comp:
                continue

            # Anti-Overwrite Guard: Check whether UserCompetency already exists
            existing_uc = (
                db.query(UserCompetency)
                .filter(
                    UserCompetency.user_id == user.id,
                    UserCompetency.competency_id == comp.id,
                )
                .first()
            )

            if existing_uc:
                skipped.append({
                    "competency_id": str(comp.id),
                    "name": comp.name,
                    "reason": "Existing competency evidence found",
                })
                continue

            initial_level, conf_score = cls.calculate_initial_competency(
                self_assessed_level=decl.self_assessed_level,
                confidence_level=decl.confidence_level,
                years_of_experience=decl.years_of_experience or 0.0,
            )

            new_uc = UserCompetency(
                user_id=user.id,
                competency_id=comp.id,
                current_level=initial_level,
                confidence_score=conf_score,
                last_assessed_at=now,
            )
            db.add(new_uc)

            created.append({
                "competency_id": str(comp.id),
                "name": comp.name,
                "initial_level": initial_level,
                "confidence": conf_score,
            })

        # Update profile onboarding step if profile exists
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if profile and created:
            profile.competency_initialized = True
            if profile.onboarding_step < 4:
                profile.onboarding_step = 4

        if created:
            db.commit()

        logger.info(
            f"Competency initialization for user {user.id}: {len(created)} created, {len(skipped)} skipped."
        )

        return {
            "created": created,
            "skipped": skipped,
        }

    # Alias for backward compatibility
    initialize_competencies_for_user = initialize_user_competencies


competency_initialization_service = CompetencyInitializationService()
