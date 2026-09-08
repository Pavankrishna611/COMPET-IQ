"""Competency Profile Update Service.

Updates learner competency proficiency levels and confidence scores based on objective assessment evidence.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.competency import Competency
from app.models.user_competency import UserCompetency

logger = logging.getLogger("competiq.services.competency_update")


def percentage_to_evidence_level(percentage: float) -> float:
    """Map quiz score percentage to a 1.0 - 5.0 competency evidence level."""
    if percentage <= 20.0:
        return 1.0
    elif percentage <= 40.0:
        return 2.0
    elif percentage <= 60.0:
        return 3.0
    elif percentage <= 80.0:
        return 4.0
    else:
        return 5.0


def calculate_updated_level(old_level: float, evidence_level: float) -> float:
    """Calculate weighted average competency level: (old_level * 0.7) + (evidence_level * 0.3).

    Clamped between 0.0 and 5.0, rounded to 2 decimal places.
    """
    updated = (old_level * 0.7) + (evidence_level * 0.3)
    clamped = max(0.0, min(5.0, updated))
    return round(clamped, 2)


def update_user_competencies_from_assessment(
    db: Session,
    user_id: uuid.UUID,
    competency_scores: List[Dict],
) -> List[UserCompetency]:
    """Update user's competency profile using scored quiz evidence per competency.

    Args:
        db: Database session.
        user_id: ID of learner who submitted the assessment.
        competency_scores: List of dicts with competency_id, competency_name, percentage, etc.

    Returns:
        List of updated or newly created UserCompetency records.
    """
    updated_records: List[UserCompetency] = []
    now = datetime.now(timezone.utc)

    for item in competency_scores:
        comp_id = item.get("competency_id")
        if not comp_id:
            # If question was not associated with a competency, skip profile update
            continue

        percentage = float(item.get("percentage", 0.0))
        evidence_level = percentage_to_evidence_level(percentage)

        # Look up existing UserCompetency
        user_comp = (
            db.query(UserCompetency)
            .filter(
                UserCompetency.user_id == user_id,
                UserCompetency.competency_id == comp_id,
            )
            .first()
        )

        if user_comp:
            old_level = user_comp.current_level
            new_level = calculate_updated_level(old_level, evidence_level)
            new_confidence = min(round(user_comp.confidence_score + 0.05, 2), 1.0)

            user_comp.current_level = new_level
            user_comp.confidence_score = new_confidence
            user_comp.last_assessed_at = now
            logger.info(
                f"Updated competency {comp_id} for user {user_id}: "
                f"{old_level} -> {new_level} (evidence: {evidence_level}, score: {percentage}%)"
            )
            updated_records.append(user_comp)
        else:
            # If competency does not exist for user, create it using evidence level
            new_user_comp = UserCompetency(
                user_id=user_id,
                competency_id=comp_id,
                current_level=evidence_level,
                confidence_score=0.6,
                last_assessed_at=now,
            )
            db.add(new_user_comp)
            logger.info(
                f"Created new competency {comp_id} for user {user_id} with level {evidence_level}"
            )
            updated_records.append(new_user_comp)

    db.commit()
    for rec in updated_records:
        db.refresh(rec)

    return updated_records
