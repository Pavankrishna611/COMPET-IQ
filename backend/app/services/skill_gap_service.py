"""Skill Gap Analysis and Proficiency Evaluation Engine."""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.competency import Competency
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.schemas.skill_gap import (
    OrganizationSkillGapSummaryResponse,
    SkillGapAnalysisResponse,
    SkillGapResponse,
    SkillGapSummary,
    TopSkillGap,
)


class SkillGapService:
    """Core intelligence engine for calculating skill gaps, priorities, and organizational aggregates."""

    @staticmethod
    def calculate_skill_gap(current_level: float, required_level: float) -> float:
        """Calculate gap between current and required competency level.

        Formula: gap = max(0.0, required_level - current_level)
        """
        gap = required_level - current_level
        return max(0.0, round(gap, 2))

    @staticmethod
    def classify_gap_priority(gap: float) -> str:
        """Classify gap into priority brackets based on predefined thresholds.

        - Gap >= 1.5           -> CRITICAL
        - 1.0 <= Gap < 1.5     -> HIGH
        - 0.5 <= Gap < 1.0     -> MODERATE
        - 0.0 < Gap < 0.5      -> LOW
        - Gap == 0.0           -> NONE
        """
        if gap >= 1.5:
            return "CRITICAL"
        elif gap >= 1.0:
            return "HIGH"
        elif gap >= 0.5:
            return "MODERATE"
        elif gap > 0.0:
            return "LOW"
        return "NONE"

    @staticmethod
    def is_strong_competency(current_level: float, required_level: float) -> bool:
        """A competency is strong when current level satisfies required level and is >= 4.0."""
        return current_level >= required_level and current_level >= 4.0

    @staticmethod
    def generate_recommended_action(priority: str) -> str:
        """Generate rule-based recommendations based on gap severity."""
        recommendations = {
            "CRITICAL": "Immediate training recommended to address this competency gap.",
            "HIGH": "Prioritized learning path recommended.",
            "MODERATE": "Complete targeted training modules.",
            "LOW": "Consider refresher learning.",
            "NONE": "Competency requirement currently satisfied.",
        }
        return recommendations.get(priority, "Competency requirement currently satisfied.")

    @classmethod
    def analyze_user_skill_gaps(cls, db: Session, user: User) -> SkillGapAnalysisResponse:
        """Generate a complete skill gap analysis for a specific user against role requirements."""
        # 1. Fetch user's current assessed competencies
        user_comps = db.query(UserCompetency).filter(UserCompetency.user_id == user.id).all()
        user_comp_map: Dict[UUID, float] = {uc.competency_id: uc.current_level for uc in user_comps}

        # 2. Fetch role requirements for user's assigned role
        requirements: List[RoleCompetencyRequirement] = []
        if user.role_id:
            requirements = (
                db.query(RoleCompetencyRequirement)
                .filter(RoleCompetencyRequirement.role_id == user.role_id)
                .all()
            )

        # Fallback: if assigned role has no requirements, check if user's designation matches a role
        if not requirements and user.designation:
            designation_role = db.query(Role).filter(Role.name == user.designation).first()
            if designation_role:
                requirements = (
                    db.query(RoleCompetencyRequirement)
                    .filter(RoleCompetencyRequirement.role_id == designation_role.id)
                    .all()
                )

        # Fallback 2: If still empty, check default LEARNER role requirements
        if not requirements:
            learner_role = db.query(Role).filter(Role.name == "LEARNER").first()
            if learner_role:
                requirements = (
                    db.query(RoleCompetencyRequirement)
                    .filter(RoleCompetencyRequirement.role_id == learner_role.id)
                    .all()
                )

        # 3. Perform gap calculations
        gap_items: List[SkillGapResponse] = []
        critical_count = 0
        high_count = 0
        moderate_count = 0
        low_count = 0
        strong_count = 0
        total_competency_score = 0.0
        total_gap_score = 0.0

        for req in requirements:
            comp = req.competency
            current_level = user_comp_map.get(req.competency_id, 0.0)
            required_level = req.required_level

            gap = cls.calculate_skill_gap(current_level, required_level)
            priority = cls.classify_gap_priority(gap)
            action = cls.generate_recommended_action(priority)
            strong = cls.is_strong_competency(current_level, required_level)

            if strong:
                strong_count += 1

            if priority == "CRITICAL":
                critical_count += 1
            elif priority == "HIGH":
                high_count += 1
            elif priority == "MODERATE":
                moderate_count += 1
            elif priority == "LOW":
                low_count += 1

            total_competency_score += current_level
            total_gap_score += gap

            gap_items.append(
                SkillGapResponse(
                    competency_id=req.competency_id,
                    competency_name=comp.name if comp else "Unknown",
                    competency_code=comp.code if comp else "UNKNOWN",
                    domain=comp.domain if comp else "General",
                    current_level=round(current_level, 2),
                    required_level=round(required_level, 2),
                    gap=gap,
                    priority=priority,
                    recommended_action=action,
                )
            )

        total_reqs = len(requirements)
        avg_comp = round(total_competency_score / total_reqs, 2) if total_reqs > 0 else 0.0
        avg_gap = round(total_gap_score / total_reqs, 2) if total_reqs > 0 else 0.0

        summary = SkillGapSummary(
            total_competencies=total_reqs,
            critical_gaps=critical_count,
            high_priority_gaps=high_count,
            moderate_gaps=moderate_count,
            low_priority_gaps=low_count,
            strong_competencies=strong_count,
            average_competency=avg_comp,
            average_gap=avg_gap,
        )

        role_label = user.role.name if user.role else "LEARNER"

        return SkillGapAnalysisResponse(
            user_id=user.id,
            role=role_label,
            summary=summary,
            skill_gaps=gap_items,
            analyzed_at=datetime.now(timezone.utc),
        )

    @classmethod
    def get_organization_summary(
        cls,
        db: Session,
        department_id: Optional[UUID] = None,
        role_id: Optional[UUID] = None,
    ) -> OrganizationSkillGapSummaryResponse:
        """Calculate aggregated organizational skill gap analytics across users."""
        query = db.query(User).filter(User.is_active == True)  # noqa: E712
        if department_id:
            query = query.filter(User.department_id == department_id)
        if role_id:
            query = query.filter(User.role_id == role_id)

        users = query.all()

        competency_gap_totals: Dict[str, Dict[str, float]] = {}

        for u in users:
            analysis = cls.analyze_user_skill_gaps(db, u)
            for item in analysis.skill_gaps:
                cname = item.competency_name
                if cname not in competency_gap_totals:
                    competency_gap_totals[cname] = {
                        "total_gap": 0.0,
                        "affected_users": 0,
                    }
                if item.gap > 0.0:
                    competency_gap_totals[cname]["total_gap"] += item.gap
                    competency_gap_totals[cname]["affected_users"] += 1

        top_gaps: List[TopSkillGap] = []
        for cname, data in competency_gap_totals.items():
            affected = int(data["affected_users"])
            if affected > 0:
                avg_gap = round(data["total_gap"] / affected, 2)
                top_gaps.append(
                    TopSkillGap(
                        competency=cname,
                        average_gap=avg_gap,
                        affected_users=affected,
                    )
                )

        # Sort top skill gaps by highest average gap first
        top_gaps.sort(key=lambda x: (x.average_gap, x.affected_users), reverse=True)

        return OrganizationSkillGapSummaryResponse(
            total_users_analyzed=len(users),
            top_skill_gaps=top_gaps,
            analyzed_at=datetime.now(timezone.utc),
        )


skill_gap_service = SkillGapService()
