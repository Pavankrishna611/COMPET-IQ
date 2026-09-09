"""Competency Evaluation and Skill-Gap Analysis Service (Part 9D).

Evaluates learner competency proficiency against official role benchmarks,
calculates non-negative skill gaps, determines priorities, and persists
evaluation records in the database.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.assessment_attempt import AssessmentAttempt
from app.models.competency import Competency
from app.models.question import Question
from app.models.question_attempt import QuestionAttempt
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration
from app.schemas.onboarding import (
    CompetencyEvaluationItem,
    CompetencyEvaluationResponse,
    CompetencyEvaluationSummary,
    LearnerProfileSummaryInfo,
)
from app.services.competency_analysis_service import (
    COMPETENCY_KEYWORD_MAP,
    _matches_keyword,
)

logger = logging.getLogger("competiq.services.competency_evaluation")

# Official default target benchmark levels for standard statistical framework competencies
FRAMEWORK_BENCHMARK_LEVELS: Dict[str, float] = {
    "TECH_PY": 4.0,
    "TECH_SQL": 3.5,
    "TECH_R": 3.5,
    "TECH_GIS": 3.5,
    "TECH_VIZ": 4.0,
    "TECH_AIML": 4.0,
    "TECH_CLOUD": 3.5,
    "STAT_SURVEY": 4.0,
    "STAT_SAMPLING": 4.0,
    "STAT_NAT_ACC": 4.5,
    "STAT_PRICE": 4.0,
    "STAT_LABOUR": 4.0,
    "STAT_QUALITY": 4.0,
    "GOV_CYBER": 3.5,
    "GOV_PRIVACY": 3.5,
    "GOV_DIGI_SIG": 3.0,
    "GOV_CLOUD": 3.5,
    "BEH_LEAD": 4.0,
    "BEH_COMM": 3.5,
    "BEH_PM": 3.5,
    "BEH_ETHICS": 4.0,
    "BEH_DECISION": 4.0,
}


class CompetencyEvaluationService:
    """Core service evaluating current competency proficiency, requirements, and skill gaps."""

    @classmethod
    def evaluate_user_competencies(
        cls,
        db: Session,
        user: User,
    ) -> CompetencyEvaluationResponse:
        """Run comprehensive competency evaluation for the authenticated user and persist results."""
        # 1. Fetch learner professional profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        job_role = (
            profile.job_role
            if profile and profile.job_role
            else (user.designation or "Statistical Officer")
        )
        dept_name = ""
        if profile:
            if profile.department:
                dept_name = (
                    profile.department.name
                    if hasattr(profile.department, "name")
                    else str(profile.department)
                )
            elif profile.current_work_area:
                dept_name = profile.current_work_area
        if not dept_name:
            dept_name = "National Statistical System"

        career_goal = profile.professional_goal if profile and profile.professional_goal else ""
        prev_trainings = (profile.previous_trainings or "").lower() if profile else ""
        exp_years = float(profile.experience_years or 0.0) if profile else 0.0

        # 2. Determine target competencies strictly from user's accepted competencies (Part 9C)
        declarations = (
            db.query(UserSkillDeclaration)
            .filter(UserSkillDeclaration.user_id == user.id)
            .all()
        )
        decl_map: Dict[uuid.UUID, UserSkillDeclaration] = {d.competency_id: d for d in declarations}

        existing_user_comps = (
            db.query(UserCompetency)
            .filter(UserCompetency.user_id == user.id)
            .all()
        )
        existing_comp_map: Dict[uuid.UUID, UserCompetency] = {
            uc.competency_id: uc for uc in existing_user_comps
        }

        # Require accepted competencies
        target_ids: Set[uuid.UUID] = set(decl_map.keys()) | set(existing_comp_map.keys())

        if not target_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No accepted competencies found. Please complete the AI competency recommendation step first.",
            )

        competencies = db.query(Competency).filter(Competency.id.in_(target_ids)).all()
        if not competencies:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target competencies not found in official framework.",
            )

        # 3. Check for objective assessment evidence
        completed_attempts = (
            db.query(AssessmentAttempt)
            .filter(
                AssessmentAttempt.user_id == user.id,
                AssessmentAttempt.status.in_(["COMPLETED", "SUBMITTED", "EVALUATED"]),
            )
            .all()
        )
        attempt_ids = [a.id for a in completed_attempts]

        comp_assessment_scores: Dict[uuid.UUID, float] = {}
        if attempt_ids:
            q_attempts = (
                db.query(QuestionAttempt, Question)
                .join(Question, QuestionAttempt.question_id == Question.id)
                .filter(
                    QuestionAttempt.attempt_id.in_(attempt_ids),
                    Question.competency_id.isnot(None),
                )
                .all()
            )
            comp_totals: Dict[uuid.UUID, Dict[str, float]] = {}
            for qa, q in q_attempts:
                c_id = q.competency_id
                if c_id not in comp_totals:
                    comp_totals[c_id] = {"points_earned": 0.0, "points_possible": 0.0}
                comp_totals[c_id]["points_earned"] += qa.points_earned
                comp_totals[c_id]["points_possible"] += q.points

            for c_id, stats in comp_totals.items():
                if stats["points_possible"] > 0:
                    pct = (stats["points_earned"] / stats["points_possible"]) * 100.0
                    comp_assessment_scores[c_id] = round(pct, 1)

        # 4. Fetch role requirements for benchmark comparison
        role_req_map: Dict[uuid.UUID, RoleCompetencyRequirement] = {}
        if user.role_id:
            role_reqs = (
                db.query(RoleCompetencyRequirement)
                .filter(RoleCompetencyRequirement.role_id == user.role_id)
                .all()
            )
            role_req_map = {r.competency_id: r for r in role_reqs}

        # 5. Evaluate each competency
        now = datetime.now(timezone.utc)
        evaluation_items: List[CompetencyEvaluationItem] = []

        total_current_level = 0.0
        total_required_level = 0.0
        requirements_met_count = 0
        critical_count = 0
        high_count = 0
        moderate_count = 0
        low_count = 0

        for comp in competencies:
            comp_keywords = COMPETENCY_KEYWORD_MAP.get(comp.code, [comp.name.lower()])

            # A. Current Competency & Evidence Evaluation
            current_level: float = 2.0
            current_source: str = "INITIAL_ESTIMATE"
            evidence_desc: str = ""

            # Check 1: ASSESSED evidence (Highest Priority - requires actual assessment attempt or ASSESSED source)
            if comp.id in comp_assessment_scores:
                pct = comp_assessment_scores[comp.id]
                if pct >= 85.0:
                    current_level = 4.5
                elif pct >= 70.0:
                    current_level = 3.8
                elif pct >= 50.0:
                    current_level = 3.0
                elif pct >= 30.0:
                    current_level = 2.0
                else:
                    current_level = 1.5
                current_source = "ASSESSED"
                evidence_desc = f"Verified from completed assessment performance ({pct}% scored)."
            elif comp.id in existing_comp_map and existing_comp_map[comp.id].evidence_source == "ASSESSED":
                uc = existing_comp_map[comp.id]
                current_level = uc.current_level
                current_source = "ASSESSED"
                evidence_desc = f"Verified from prior formal assessment record ({round(current_level, 1)} / 5.0)."

            # Check 2: Existing competency record explicitly updated (e.g. verified rating >= 4.0 or custom level)
            elif (
                comp.id in existing_comp_map
                and existing_comp_map[comp.id].current_level >= 4.5
            ):
                uc = existing_comp_map[comp.id]
                current_level = uc.current_level
                current_source = uc.evidence_source or "EXPERIENCE"
                evidence_desc = f"Established from existing competency record ({round(current_level, 1)} / 5.0)."

            # Check 3: TRAINING evidence
            elif prev_trainings and any(_matches_keyword(kw, prev_trainings) for kw in comp_keywords):
                current_level = 3.0
                current_source = "TRAINING"
                evidence_desc = f"Supported by documented coursework in '{profile.previous_trainings[:45]}...'."

            # Check 4: EXPERIENCE evidence (senior practitioner >= 5.0 yrs)
            elif exp_years >= 5.0 and any(
                w in job_role.lower() for w in ["officer", "analyst", "investigator", "director"]
            ):
                current_level = 3.2
                current_source = "EXPERIENCE"
                evidence_desc = f"Derived from {round(exp_years, 1)} years of documented professional work experience."

            # Check 5: Existing record from UserCompetency if available
            elif comp.id in existing_comp_map and existing_comp_map[comp.id].current_level > 0:
                uc = existing_comp_map[comp.id]
                current_level = uc.current_level
                current_source = "INITIAL_ESTIMATE"
                evidence_desc = f"Initial estimate based on profile onboarding and self-assessment ({round(current_level, 1)} / 5.0)."

            # Check 6: SELF_REPORTED / INITIAL_ESTIMATE from UserSkillDeclaration for newly registered learners
            elif comp.id in decl_map:
                decl = decl_map[comp.id]
                base_levels = {1: 1.5, 2: 2.0, 3: 2.8, 4: 3.5, 5: 4.0}
                current_level = base_levels.get(decl.self_assessed_level, 2.0)
                current_source = "INITIAL_ESTIMATE"
                evidence_desc = f"Initial estimate based on profile onboarding and self-assessment ({decl.self_assessed_level}/5)."

            else:
                current_level = 2.0
                current_source = "INITIAL_ESTIMATE"
                evidence_desc = "Initial baseline estimate based on professional profile."

            current_level = round(max(1.0, min(5.0, current_level)), 1)

            # B. Required Competency Level Evaluation (Official Framework Grounded)
            required_level = 4.0
            if comp.id in role_req_map:
                required_level = role_req_map[comp.id].required_level
            elif comp.code in FRAMEWORK_BENCHMARK_LEVELS:
                base_benchmark = FRAMEWORK_BENCHMARK_LEVELS[comp.code]
                if exp_years >= 6.0 or any(w in job_role.lower() for w in ["senior", "director"]):
                    required_level = min(5.0, base_benchmark + 0.5)
                elif exp_years < 2.0:
                    required_level = max(3.0, base_benchmark - 0.5)
                else:
                    required_level = base_benchmark
            else:
                required_level = 4.0 if exp_years >= 4.0 else 3.5

            required_level = round(max(1.0, min(5.0, required_level)), 1)

            # C. Competency Gap Calculation (Non-Negative Guarantee)
            raw_gap = required_level - current_level
            gap = round(max(0.0, raw_gap), 1)
            is_met = gap == 0.0

            if is_met:
                requirements_met_count += 1

            # D. Role Relevance & Priority Determination
            role_str = f"{job_role} {dept_name} {career_goal}".lower()
            is_core_role = any(_matches_keyword(kw, role_str) for kw in comp_keywords)
            relevance_level = "CRITICAL" if is_core_role else "HIGH"

            if is_met:
                priority = "MET"
            elif gap >= 1.5 and relevance_level in {"CRITICAL", "HIGH"}:
                priority = "CRITICAL"
                critical_count += 1
            elif gap >= 1.0 or (gap >= 0.8 and relevance_level == "CRITICAL"):
                priority = "HIGH"
                high_count += 1
            elif gap >= 0.4:
                priority = "MEDIUM"
                moderate_count += 1
            else:
                priority = "LOW"
                low_count += 1

            # E. Why Required (Explainability)
            why_required = (
                f"Essential competency required for {job_role} responsibilities in {dept_name}."
                if not career_goal
                else f"Required for {job_role} responsibilities and directly supports your career objective: '{career_goal}'."
            )

            # F. Persist into UserCompetency
            user_comp = (
                db.query(UserCompetency)
                .filter(
                    UserCompetency.user_id == user.id,
                    UserCompetency.competency_id == comp.id,
                )
                .first()
            )
            confidence = 0.85 if current_source == "ASSESSED" else 0.55

            if user_comp:
                user_comp.current_level = current_level
                user_comp.required_level = required_level
                user_comp.gap = gap
                user_comp.priority = priority
                user_comp.evidence_source = current_source
                user_comp.evaluation_date = now
                user_comp.confidence_score = confidence
            else:
                user_comp = UserCompetency(
                    user_id=user.id,
                    competency_id=comp.id,
                    current_level=current_level,
                    required_level=required_level,
                    gap=gap,
                    priority=priority,
                    evidence_source=current_source,
                    evaluation_date=now,
                    confidence_score=confidence,
                )
                db.add(user_comp)

            total_current_level += current_level
            total_required_level += required_level

            evaluation_items.append(
                CompetencyEvaluationItem(
                    competency_id=comp.id,
                    competency_name=comp.name,
                    competency_code=comp.code,
                    domain=comp.domain,
                    current_level=current_level,
                    current_level_source=current_source,
                    required_level=required_level,
                    gap=gap,
                    priority=priority,
                    relevance=relevance_level,
                    why_required=why_required,
                    evidence=evidence_desc,
                    requirement_met=is_met,
                )
            )

        # Advance user onboarding step to 4
        if profile:
            if (profile.onboarding_step or 0) < 4:
                profile.onboarding_step = 4

        db.commit()
        logger.info(f"Successfully evaluated and persisted {len(evaluation_items)} competencies for user {user.id}")

        # 6. Build Summary Metrics
        n = len(evaluation_items)
        avg_current = round(total_current_level / n, 2) if n > 0 else 0.0
        avg_required = round(total_required_level / n, 2) if n > 0 else 0.0

        if critical_count > 0:
            gap_indicator = "Critical Gaps Identified"
        elif high_count > 0:
            gap_indicator = "Targeted Upskilling Recommended"
        elif requirements_met_count == n:
            gap_indicator = "All Requirements Met"
        else:
            gap_indicator = "On Track"

        overall_score = round(avg_current, 1) if n > 0 else None

        summary = CompetencyEvaluationSummary(
            total_competencies=n,
            requirements_met=requirements_met_count,
            critical_gaps=critical_count,
            high_priority_gaps=high_count,
            moderate_gaps=moderate_count,
            low_priority_gaps=low_count,
            average_current_level=avg_current,
            average_required_level=avg_required,
            overall_competency_score=overall_score,
            overall_gap_indicator=gap_indicator,
        )

        learner_info = LearnerProfileSummaryInfo(
            full_name=user.full_name,
            designation=profile.designation if profile else user.designation,
            job_role=job_role,
            department=dept_name,
            career_goal=career_goal or "Professional development in official statistics",
        )

        return CompetencyEvaluationResponse(
            learner_profile=learner_info,
            summary=summary,
            competencies=evaluation_items,
            evaluated_at=now,
        )


competency_evaluation_service = CompetencyEvaluationService()
