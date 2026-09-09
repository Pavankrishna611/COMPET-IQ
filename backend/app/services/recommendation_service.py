"""Rule-based, explainable Course Recommendation Engine (Part 9E)."""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.competency import Competency
from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.course_prerequisite import CoursePrerequisite
from app.models.learning_path import LearningPath
from app.models.learning_path_item import LearningPathItem
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_interested_course import UserInterestedCourse
from app.models.user_profile import UserProfile
from app.schemas.recommendation import (
    CourseRecommendationResponse,
    InterestedCourseResponse,
)
from app.services.skill_gap_service import skill_gap_service

logger = logging.getLogger("competiq.services.recommendations")

# -----------------------------------------------------------------------------
# Explainable Recommendation Scoring Constants
# -----------------------------------------------------------------------------
SCORE_GAP_CRITICAL = 50
SCORE_GAP_HIGH = 35
SCORE_GAP_MODERATE = 20
SCORE_GAP_LOW = 10
SCORE_ADDRESSES_COMPETENCY = 20
SCORE_ROLE_RELEVANCE = 15
SCORE_CAREER_GOAL = 10
SCORE_DIFFICULTY_MATCH = 10
SCORE_PREREQUISITES_SATISFIED = 10


class RecommendationService:
    """Deterministic, explainable engine recommending courses based on competency gaps, role benchmarks, and learner goals."""

    @staticmethod
    def get_recommended_difficulty(current_level: float) -> str:
        """Determine target course difficulty based on current competency level.

        - level < 2.5         -> Beginner
        - 2.5 <= level <= 3.8 -> Intermediate
        - level > 3.8         -> Advanced
        """
        if current_level < 2.5:
            return "Beginner"
        elif current_level <= 3.8:
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
        """Compute ranked, explainable course recommendations targeting the user's active skill gaps.

        SAFETY: This method NEVER modifies UserCompetency.current_level.
        """
        # 1. Fetch learner's professional profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        job_role = (
            profile.job_role
            if profile and profile.job_role
            else (user.designation or "Statistical Officer")
        ).strip()
        career_goal = (
            profile.professional_goal
            if profile and profile.professional_goal
            else ""
        ).strip()
        dept_name = (
            profile.current_work_area
            if profile and profile.current_work_area
            else ""
        ).strip()

        # 2. Collect user's competency gaps
        # Primary: Check evaluated UserCompetency records (persisted in Part 9D)
        user_comps = (
            db.query(UserCompetency)
            .options(joinedload(UserCompetency.competency))
            .filter(UserCompetency.user_id == user.id)
            .all()
        )

        gap_map: Dict[UUID, Dict] = {}
        user_comp_levels: Dict[UUID, float] = {}

        if user_comps:
            for uc in user_comps:
                user_comp_levels[uc.competency_id] = uc.current_level
                comp_name = uc.competency.name if uc.competency else "Competency"
                gap_val = uc.gap if uc.gap is not None else max(0.0, (uc.required_level or 4.0) - uc.current_level)
                priority_val = uc.priority or ("CRITICAL" if gap_val >= 1.5 else "HIGH" if gap_val >= 1.0 else "MODERATE" if gap_val >= 0.5 else "LOW")
                gap_map[uc.competency_id] = {
                    "competency_id": uc.competency_id,
                    "competency_name": comp_name,
                    "current_level": uc.current_level,
                    "required_level": uc.required_level or 4.0,
                    "gap": round(gap_val, 2),
                    "priority": priority_val,
                }
        else:
            # Fallback to skill_gap_service if UserCompetency records not evaluated yet
            analysis = skill_gap_service.analyze_user_skill_gaps(db, user)
            for item in analysis.skill_gaps:
                user_comp_levels[item.competency_id] = item.current_level
                gap_map[item.competency_id] = {
                    "competency_id": item.competency_id,
                    "competency_name": item.competency_name,
                    "current_level": item.current_level,
                    "required_level": item.required_level,
                    "gap": item.gap,
                    "priority": item.priority,
                }

        # 3. Completed courses (to avoid recommending completed courses)
        completed_course_ids = cls.get_completed_course_ids(db, user.id)

        # 4. Interested courses
        interested_course_ids = {
            ic.course_id
            for ic in db.query(UserInterestedCourse.course_id).filter(UserInterestedCourse.user_id == user.id).all()
        }

        # 5. Active learning path courses
        learning_path_course_ids = {
            lpi.course_id
            for lpi in db.query(LearningPathItem.course_id)
            .join(LearningPath, LearningPathItem.learning_path_id == LearningPath.id)
            .filter(LearningPath.user_id == user.id, LearningPath.status == "ACTIVE")
            .all()
        }

        # 6. Fetch all active catalog courses
        active_courses = (
            db.query(Course)
            .options(
                joinedload(Course.course_competencies).joinedload(CourseCompetency.competency),
                joinedload(Course.prerequisites).joinedload(CoursePrerequisite.prerequisite_course),
            )
            .filter(Course.is_active == True)  # noqa: E712
            .all()
        )

        priority_ranks = {
            "CRITICAL": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "MODERATE": 2,
            "LOW": 1,
            "MET": 0,
            "NONE": 0,
        }

        recommendations: List[CourseRecommendationResponse] = []

        for course in active_courses:
            # Skip if user has already completed this course
            if course.id in completed_course_ids:
                continue

            # Identify matching competencies and matching gaps
            matching_gaps = []
            matching_comp_names = []
            for cc in course.course_competencies:
                if cc.competency_id in gap_map:
                    matching_gaps.append(gap_map[cc.competency_id])
                    if cc.competency:
                        matching_comp_names.append(cc.competency.name)
                elif cc.competency:
                    matching_comp_names.append(cc.competency.name)

            # Filter for gaps with gap > 0
            active_gaps = [g for g in matching_gaps if g["gap"] > 0.0]

            # Role relevance matching
            role_context = f"{job_role} {dept_name}".lower()
            career_context = career_goal.lower()
            course_text = f"{course.title} {course.domain or ''} {' '.join(matching_comp_names)} {course.description or ''}".lower()

            role_keywords = [w for w in role_context.replace(",", " ").split() if len(w) > 3]
            career_keywords = [w for w in career_context.replace(",", " ").split() if len(w) > 3]

            is_role_relevant = any(kw in course_text for kw in role_keywords) if role_keywords else False
            is_goal_relevant = any(kw in course_text for kw in career_keywords) if career_keywords else False

            # If the course doesn't address an active gap, check if it directly supports role/career goal
            if not active_gaps and not matching_gaps and not (is_role_relevant or is_goal_relevant):
                continue

            score = 0
            reason_parts: List[str] = []

            if active_gaps:
                # Rank top gap addressed
                top_gap_item = max(active_gaps, key=lambda g: (priority_ranks.get(g["priority"].upper(), 0), g["gap"]))
                top_prio = top_gap_item["priority"].upper()
                if top_prio == "MEDIUM":
                    top_prio = "MODERATE"

                if top_prio == "CRITICAL":
                    score += SCORE_GAP_CRITICAL
                elif top_prio == "HIGH":
                    score += SCORE_GAP_HIGH
                elif top_prio == "MODERATE":
                    score += SCORE_GAP_MODERATE
                else:
                    score += SCORE_GAP_LOW

                score += SCORE_ADDRESSES_COMPETENCY
                if len(active_gaps) > 1:
                    score += 10  # Addresses multiple active gaps

                reason_parts.append(
                    f"Directly addresses your {top_prio.lower()} {top_gap_item['competency_name']} competency gap ({top_gap_item['gap']} level delta)."
                )
                item_priority = top_prio
                target_level = top_gap_item["current_level"]
            elif matching_gaps:
                top_gap_item = matching_gaps[0]
                item_priority = "LOW"
                score += SCORE_ADDRESSES_COMPETENCY
                reason_parts.append(f"Reinforces advanced competency in {top_gap_item['competency_name']}.")
                target_level = top_gap_item["current_level"]
            else:
                item_priority = "LOW"
                score += 25
                reason_parts.append(f"Supports continuous professional development in {course.domain or 'official statistics'}.")
                target_level = 2.0

            # Role relevance boost
            if is_role_relevant:
                score += SCORE_ROLE_RELEVANCE
                reason_parts.append(f"Directly relevant to your role as {job_role}.")

            # Career goal boost
            if is_goal_relevant and career_goal:
                score += SCORE_CAREER_GOAL
                reason_parts.append(f"Supports your stated career objective: '{career_goal[:50]}'.")

            # Difficulty match
            expected_diff = cls.get_recommended_difficulty(target_level)
            difficulty_matched = course.difficulty.lower() == expected_diff.lower()
            if difficulty_matched:
                score += SCORE_DIFFICULTY_MATCH
                reason_parts.append(f"Level matches your current readiness ({course.difficulty}).")

            # Prerequisite match
            prereqs_satisfied = cls.are_prerequisites_satisfied(course, completed_course_ids, user_comp_levels)
            if prereqs_satisfied:
                score += SCORE_PREREQUISITES_SATISFIED
            else:
                reason_parts.append("Foundational prerequisites recommended before starting.")

            # Normalization
            final_score = min(99, max(30, score))

            recommendations.append(
                CourseRecommendationResponse(
                    course_id=course.id,
                    course_title=course.title,
                    provider=course.provider,
                    difficulty=course.difficulty,
                    duration_hours=course.duration_hours,
                    domain=course.domain,
                    recommendation_score=final_score,
                    priority=item_priority,
                    matching_competencies=list(dict.fromkeys(matching_comp_names)),
                    reason=" ".join(reason_parts),
                    is_interested=course.id in interested_course_ids,
                    is_in_learning_path=course.id in learning_path_course_ids,
                )
            )

        # Sort recommendations by highest score first, then shorter duration
        recommendations.sort(key=lambda r: (r.recommendation_score, -r.duration_hours), reverse=True)

        return recommendations[:limit]

    @classmethod
    def mark_course_interested(
        cls,
        db: Session,
        user: User,
        course_id: UUID,
    ) -> InterestedCourseResponse:
        """Mark a course as interested/bookmarked by the learner.

        SAFETY: Marking 'Interested' does NOT enroll the learner, nor does it
        modify UserCompetency.current_level.
        """
        course = db.query(Course).filter(Course.id == course_id, Course.is_active == True).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID '{course_id}' not found in catalog.",
            )

        existing = (
            db.query(UserInterestedCourse)
            .filter(
                UserInterestedCourse.user_id == user.id,
                UserInterestedCourse.course_id == course_id,
            )
            .first()
        )

        now = datetime.now(timezone.utc)
        if not existing:
            interested_entry = UserInterestedCourse(
                user_id=user.id,
                course_id=course_id,
                marked_at=now,
            )
            db.add(interested_entry)
            db.commit()
            db.refresh(interested_entry)
        else:
            interested_entry = existing

        # Check if course is in active learning path
        in_path = (
            db.query(LearningPathItem)
            .join(LearningPath, LearningPathItem.learning_path_id == LearningPath.id)
            .filter(
                LearningPath.user_id == user.id,
                LearningPath.status == "ACTIVE",
                LearningPathItem.course_id == course_id,
            )
            .first()
            is not None
        )

        return InterestedCourseResponse(
            id=interested_entry.id,
            course_id=course.id,
            course_title=course.title,
            provider=course.provider,
            difficulty=course.difficulty,
            duration_hours=course.duration_hours,
            domain=course.domain,
            marked_at=interested_entry.marked_at,
            is_in_learning_path=in_path,
        )

    @classmethod
    def remove_course_interested(
        cls,
        db: Session,
        user: User,
        course_id: UUID,
    ) -> bool:
        """Remove a course from the learner's interested list."""
        entry = (
            db.query(UserInterestedCourse)
            .filter(
                UserInterestedCourse.user_id == user.id,
                UserInterestedCourse.course_id == course_id,
            )
            .first()
        )
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course is not in your interested courses list.",
            )

        db.delete(entry)
        db.commit()
        return True

    @classmethod
    def get_user_interested_courses(
        cls,
        db: Session,
        user: User,
    ) -> List[InterestedCourseResponse]:
        """Retrieve all courses marked as interested by the authenticated learner."""
        entries = (
            db.query(UserInterestedCourse)
            .options(joinedload(UserInterestedCourse.course))
            .filter(UserInterestedCourse.user_id == user.id)
            .order_by(UserInterestedCourse.marked_at.desc())
            .all()
        )

        learning_path_course_ids = {
            lpi.course_id
            for lpi in db.query(LearningPathItem.course_id)
            .join(LearningPath, LearningPathItem.learning_path_id == LearningPath.id)
            .filter(LearningPath.user_id == user.id, LearningPath.status == "ACTIVE")
            .all()
        }

        results: List[InterestedCourseResponse] = []
        for entry in entries:
            if not entry.course:
                continue
            results.append(
                InterestedCourseResponse(
                    id=entry.id,
                    course_id=entry.course.id,
                    course_title=entry.course.title,
                    provider=entry.course.provider,
                    difficulty=entry.course.difficulty,
                    duration_hours=entry.course.duration_hours,
                    domain=entry.course.domain,
                    marked_at=entry.marked_at,
                    is_in_learning_path=entry.course.id in learning_path_course_ids,
                )
            )
        return results


recommendation_service = RecommendationService()
