"""Rule-based, explainable Course Recommendation Engine."""

from typing import Dict, List, Optional, Set
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.course_prerequisite import CoursePrerequisite
from app.models.learning_path import LearningPath
from app.models.learning_path_item import LearningPathItem
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.schemas.recommendation import CourseRecommendationResponse
from app.services.skill_gap_service import skill_gap_service

# -----------------------------------------------------------------------------
# Explainable Recommendation Scoring Constants
# -----------------------------------------------------------------------------
SCORE_GAP_CRITICAL = 50
SCORE_GAP_HIGH = 35
SCORE_GAP_MODERATE = 20
SCORE_GAP_LOW = 10
SCORE_ADDRESSES_COMPETENCY = 25
SCORE_DIFFICULTY_MATCH = 10
SCORE_PREREQUISITES_SATISFIED = 10


class RecommendationService:
    """Deterministic, explainable engine recommending courses based on competency gaps and readiness."""

    @staticmethod
    def get_recommended_difficulty(current_level: float) -> str:
        """Determine target course difficulty based on current competency level.

        - level < 2.0        -> Beginner
        - 2.0 <= level <= 3.5 -> Intermediate
        - level > 3.5        -> Advanced
        """
        if current_level < 2.0:
            return "Beginner"
        elif current_level <= 3.5:
            return "Intermediate"
        return "Advanced"

    @staticmethod
    def get_completed_course_ids(db: Session, user_id: UUID) -> Set[UUID]:
        """Fetch all course IDs that the user has marked as COMPLETED across any learning path."""
        completed_items = (
            db.query(LearningPathItem.course_id)
            .join(LearningPath, LearningPathItem.learning_path_id == LearningPath.id)
            .filter(
                LearningPath.user_id == user_id,
                LearningPathItem.status == "COMPLETED",
            )
            .all()
        )
        return {item[0] for item in completed_items}

    @classmethod
    def are_prerequisites_satisfied(
        cls,
        course: Course,
        completed_course_ids: Set[UUID],
        user_comp_map: Dict[UUID, float],
    ) -> bool:
        """Verify if all prerequisite courses for this course are satisfied."""
        if not course.prerequisites:
            return True

        for prereq in course.prerequisites:
            prereq_id = prereq.prerequisite_course_id
            # 1. Satisfied if course already completed
            if prereq_id in completed_course_ids:
                continue

            # 2. Satisfied if user already has intermediate proficiency (>= 3.0) in the course's domain competencies
            prereq_course = prereq.prerequisite_course
            domain_satisfied = False
            if prereq_course and prereq_course.course_competencies:
                for cc in prereq_course.course_competencies:
                    if user_comp_map.get(cc.competency_id, 0.0) >= 3.0:
                        domain_satisfied = True
                        break

            if not domain_satisfied:
                return False

        return True

    @classmethod
    def get_recommendations_for_user(
        cls,
        db: Session,
        user: User,
        limit: int = 10,
    ) -> List[CourseRecommendationResponse]:
        """Compute ranked, explainable course recommendations targeting the user's active skill gaps."""
        # 1. Analyze user's skill gaps
        analysis = skill_gap_service.analyze_user_skill_gaps(db, user)
        if not analysis.skill_gaps:
            return []

        # Map competency gaps by competency_id
        gap_map = {item.competency_id: item for item in analysis.skill_gaps if item.gap > 0.0}
        if not gap_map:
            return []

        # Fetch user's current assessed competency levels
        user_comps = db.query(UserCompetency).filter(UserCompetency.user_id == user.id).all()
        user_comp_map: Dict[UUID, float] = {uc.competency_id: uc.current_level for uc in user_comps}

        # Fetch completed course IDs
        completed_course_ids = cls.get_completed_course_ids(db, user.id)

        # 2. Fetch all active courses with competencies and prerequisites
        active_courses = (
            db.query(Course)
            .options(
                joinedload(Course.course_competencies).joinedload(CourseCompetency.competency),
                joinedload(Course.prerequisites).joinedload(CoursePrerequisite.prerequisite_course),
            )
            .filter(Course.is_active == True)  # noqa: E712
            .all()
        )

        recommendations: List[CourseRecommendationResponse] = []

        for course in active_courses:
            # Skip if user has already completed this course
            if course.id in completed_course_ids:
                continue

            # Check matching competencies
            matching_gaps = []
            matching_comp_names = []
            for cc in course.course_competencies:
                if cc.competency_id in gap_map:
                    matching_gaps.append(gap_map[cc.competency_id])
                    if cc.competency:
                        matching_comp_names.append(cc.competency.name)

            if not matching_gaps:
                continue

            # Determine highest priority gap addressed by this course
            priority_ranks = {"CRITICAL": 4, "HIGH": 3, "MODERATE": 2, "LOW": 1, "NONE": 0}
            top_gap_item = max(matching_gaps, key=lambda g: priority_ranks.get(g.priority, 0))

            # 3. Calculate Score
            score = 0
            if top_gap_item.priority == "CRITICAL":
                score += SCORE_GAP_CRITICAL
            elif top_gap_item.priority == "HIGH":
                score += SCORE_GAP_HIGH
            elif top_gap_item.priority == "MODERATE":
                score += SCORE_GAP_MODERATE
            else:
                score += SCORE_GAP_LOW

            # Bonus: Directly addresses target competency
            score += SCORE_ADDRESSES_COMPETENCY

            # Difficulty match
            expected_diff = cls.get_recommended_difficulty(top_gap_item.current_level)
            difficulty_matched = course.difficulty.lower() == expected_diff.lower()
            if difficulty_matched:
                score += SCORE_DIFFICULTY_MATCH

            # Prerequisite match
            prereqs_satisfied = cls.are_prerequisites_satisfied(course, completed_course_ids, user_comp_map)
            if prereqs_satisfied:
                score += SCORE_PREREQUISITES_SATISFIED

            # Clamp score between 0 and 100
            final_score = min(100, max(0, score))

            # Explainable rationale string
            reason_parts = [
                f"Recommended because it addresses a {top_gap_item.priority.lower()} {top_gap_item.competency_name} competency gap (gap: {top_gap_item.gap})."
            ]
            if difficulty_matched:
                reason_parts.append(f"Course difficulty ({course.difficulty}) matches your current proficiency.")
            if not prereqs_satisfied:
                reason_parts.append("Note: Prerequisite foundational modules are also recommended.")

            recommendations.append(
                CourseRecommendationResponse(
                    course_id=course.id,
                    course_title=course.title,
                    provider=course.provider,
                    difficulty=course.difficulty,
                    duration_hours=course.duration_hours,
                    recommendation_score=final_score,
                    priority=top_gap_item.priority,
                    matching_competencies=list(set(matching_comp_names)),
                    reason=" ".join(reason_parts),
                )
            )

        # Sort recommendations by highest score first, then duration
        recommendations.sort(key=lambda r: (r.recommendation_score, -r.duration_hours), reverse=True)

        return recommendations[:limit]


recommendation_service = RecommendationService()
