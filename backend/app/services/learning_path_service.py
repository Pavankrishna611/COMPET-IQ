"""Personalized Learning Path Generation and Progress Tracking Engine."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.course_prerequisite import CoursePrerequisite
from app.models.learning_path import LearningPath
from app.models.learning_path_item import LearningPathItem
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.schemas.learning_path import LearningPathGenerationResponse, LearningPathResponse
from app.services.recommendation_service import recommendation_service
from app.services.skill_gap_service import skill_gap_service


class LearningPathService:
    """Orchestrates personalized learning paths, dependency ordering, and progress updates."""

    @classmethod
    def generate_learning_path(
        cls,
        db: Session,
        user: User,
        force: bool = False,
    ) -> LearningPathGenerationResponse:
        """Generate an individualized, sequenced learning path addressing the user's active skill gaps."""
        # 1. Check for existing active learning path
        active_path = (
            db.query(LearningPath)
            .filter(LearningPath.user_id == user.id, LearningPath.status == "ACTIVE")
            .first()
        )

        if active_path:
            # Archive previous active path to preserve historical journey
            active_path.status = "ARCHIVED"
            db.flush()

        # 2. Get user skill gaps
        analysis = skill_gap_service.analyze_user_skill_gaps(db, user)
        skill_gaps = [item for item in analysis.skill_gaps if item.gap > 0.0]

        # 3. Get course recommendations targeting those gaps
        recommendations = recommendation_service.get_recommendations_for_user(db, user, limit=20)

        # 4. Determine courses and resolve prerequisite sequencing
        completed_course_ids = recommendation_service.get_completed_course_ids(db, user.id)

        # Build candidate course pool preserving recommendation order
        ordered_courses: List[Course] = []
        seen_course_ids: Set[UUID] = set()
        course_reasons: Dict[UUID, str] = {}
        course_priorities: Dict[UUID, str] = {}

        for rec in recommendations:
            if rec.course_id not in seen_course_ids:
                course = (
                    db.query(Course)
                    .options(
                        joinedload(Course.prerequisites).joinedload(CoursePrerequisite.prerequisite_course),
                        joinedload(Course.course_competencies),
                    )
                    .filter(Course.id == rec.course_id)
                    .first()
                )
                if not course:
                    continue

                # Resolve prerequisites: if course has uncompleted prerequisites, add them first!
                if course.prerequisites:
                    for prereq in course.prerequisites:
                        p_course = prereq.prerequisite_course
                        if p_course and p_course.id not in completed_course_ids and p_course.id not in seen_course_ids:
                            ordered_courses.append(p_course)
                            seen_course_ids.add(p_course.id)
                            course_reasons[p_course.id] = (
                                f"Foundational prerequisite course required before taking {course.title}."
                            )
                            course_priorities[p_course.id] = rec.priority

                # Add target course
                if course.id not in seen_course_ids:
                    ordered_courses.append(course)
                    seen_course_ids.add(course.id)
                    course_reasons[course.id] = rec.reason
                    course_priorities[course.id] = rec.priority

        # 5. Calculate total duration
        total_duration = sum(c.duration_hours for c in ordered_courses)
        role_title = user.role.name if user.role else "LEARNER"
        path_title = f"Personalized Learning Path for {user.full_name} ({role_title})"
        path_desc = (
            f"Tailored learning sequence addressing {len(skill_gaps)} identified competency gaps "
            f"with {len(ordered_courses)} sequenced modules."
        )

        # 6. Create LearningPath record
        new_path = LearningPath(
            user_id=user.id,
            title=path_title,
            description=path_desc,
            target_role=role_title,
            estimated_duration_hours=round(total_duration, 1),
            status="ACTIVE",
            generated_at=datetime.now(timezone.utc),
        )
        db.add(new_path)
        db.flush()

        # 7. Create LearningPathItems in sequence
        for idx, course in enumerate(ordered_courses, start=1):
            item = LearningPathItem(
                learning_path_id=new_path.id,
                course_id=course.id,
                sequence_order=idx,
                status="NOT_STARTED",
                priority=course_priorities.get(course.id, "MODERATE"),
                reason=course_reasons.get(course.id, "Recommended for competency growth."),
                estimated_duration_hours=course.duration_hours,
            )
            db.add(item)

        db.commit()

        # Reload with relations
        saved_path = cls.get_learning_path_by_id(db, new_path.id)

        return LearningPathGenerationResponse(
            learning_path=saved_path,
            skill_gaps_used=len(skill_gaps),
            courses_recommended=len(ordered_courses),
            generated_at=new_path.generated_at,
        )

    @classmethod
    def get_active_learning_path(cls, db: Session, user_id: UUID) -> LearningPath:
        """Fetch the currently active learning path for a user with eager loaded steps."""
        path = (
            db.query(LearningPath)
            .options(
                joinedload(LearningPath.items)
                .joinedload(LearningPathItem.course)
            )
            .filter(LearningPath.user_id == user_id, LearningPath.status == "ACTIVE")
            .first()
        )
        if not path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active learning path found for this user. Generate one to get started.",
            )
        return path

    @classmethod
    def get_learning_path_by_id(cls, db: Session, path_id: UUID) -> LearningPath:
        """Fetch a specific learning path by its UUID."""
        path = (
            db.query(LearningPath)
            .options(
                joinedload(LearningPath.items)
                .joinedload(LearningPathItem.course)
            )
            .filter(LearningPath.id == path_id)
            .first()
        )
        if not path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Learning path with ID '{path_id}' not found.",
            )
        return path

    @classmethod
    def get_learning_path_history(cls, db: Session, user_id: UUID) -> List[LearningPath]:
        """Fetch all historical and active learning paths for a user."""
        return (
            db.query(LearningPath)
            .options(
                joinedload(LearningPath.items)
                .joinedload(LearningPathItem.course)
            )
            .filter(LearningPath.user_id == user_id)
            .order_by(LearningPath.generated_at.desc())
            .all()
        )

    @classmethod
    def update_item_status(
        cls,
        db: Session,
        user: User,
        item_id: UUID,
        new_status: str,
    ) -> LearningPathItem:
        """Update progress status of a learning path step with ownership validation."""
        item = (
            db.query(LearningPathItem)
            .options(
                joinedload(LearningPathItem.learning_path),
                joinedload(LearningPathItem.course),
            )
            .filter(LearningPathItem.id == item_id)
            .first()
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Learning path item with ID '{item_id}' not found.",
            )

        # Ownership validation: user must own path unless user has ADMIN role
        user_is_admin = user.role and user.role.name == "ADMIN"
        if item.learning_path.user_id != user.id and not user_is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify another user's learning path.",
            )

        item.status = new_status
        db.flush()

        # Check if all items in active path are completed
        all_items = (
            db.query(LearningPathItem)
            .filter(LearningPathItem.learning_path_id == item.learning_path_id)
            .all()
        )
        if all(i.status == "COMPLETED" for i in all_items):
            item.learning_path.status = "COMPLETED"

        db.commit()
        db.refresh(item)
        return item

    @classmethod
    def get_user_watch_time_stats(cls, db: Session, user_id: UUID) -> Dict[str, Any]:
        """Calculate total watch time and progress metrics across the user's active/completed learning paths."""
        active_path = (
            db.query(LearningPath)
            .options(
                joinedload(LearningPath.items)
                .joinedload(LearningPathItem.course)
            )
            .filter(LearningPath.user_id == user_id, LearningPath.status == "ACTIVE")
            .first()
        )

        if not active_path or not active_path.items:
            return {
                "total_watch_hours": 0.0,
                "completed_courses_count": 0,
                "in_progress_courses_count": 0,
                "total_courses_count": 0,
                "completion_rate_percent": 0.0,
            }

        total_courses = len(active_path.items)
        completed_count = 0
        in_progress_count = 0
        watch_hours = 0.0

        for item in active_path.items:
            duration = item.estimated_duration_hours or (item.course.duration_hours if item.course else 0.0) or 0.0
            if item.status == "COMPLETED":
                completed_count += 1
                watch_hours += duration
            elif item.status == "IN_PROGRESS":
                in_progress_count += 1
                # Partial duration (approx. 45%) watched for in-progress modules
                watch_hours += round(duration * 0.45, 1)

        completion_rate = round((completed_count / total_courses) * 100, 1) if total_courses > 0 else 0.0

        return {
            "total_watch_hours": round(watch_hours, 1),
            "completed_courses_count": completed_count,
            "in_progress_courses_count": in_progress_count,
            "total_courses_count": total_courses,
            "completion_rate_percent": completion_rate,
        }

    @classmethod
    def add_course_to_learning_path(
        cls,
        db: Session,
        user: User,
        course_id: UUID,
    ) -> LearningPathItem:
        """Add a recommended course to the learner's active learning path.

        Prevents duplicate entries and sets appropriate sequence order and gap priority.
        SAFETY: This method NEVER alters UserCompetency.current_level.
        """
        course = (
            db.query(Course)
            .options(
                joinedload(Course.course_competencies).joinedload(CourseCompetency.competency),
            )
            .filter(Course.id == course_id, Course.is_active == True)
            .first()
        )
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID '{course_id}' not found in active catalog.",
            )

        # 1. Get or create active learning path
        active_path = (
            db.query(LearningPath)
            .options(
                joinedload(LearningPath.items).joinedload(LearningPathItem.course)
            )
            .filter(LearningPath.user_id == user.id, LearningPath.status == "ACTIVE")
            .first()
        )

        if not active_path:
            role_title = user.role.name if user.role else (user.designation or "LEARNER")
            active_path = LearningPath(
                user_id=user.id,
                title=f"Personalized Learning Path for {user.full_name}",
                description=f"Individualized learning sequence for {role_title} professional development.",
                target_role=role_title,
                estimated_duration_hours=0.0,
                status="ACTIVE",
                generated_at=datetime.now(timezone.utc),
            )
            db.add(active_path)
            db.flush()

        # 2. Prevent duplicates in the active path
        for item in active_path.items:
            if item.course_id == course_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This course is already in your active learning path.",
                )

        # 3. Determine priority and reason from user competencies
        user_comps = (
            db.query(UserCompetency)
            .options(joinedload(UserCompetency.competency))
            .filter(UserCompetency.user_id == user.id)
            .all()
        )
        user_comp_map = {uc.competency_id: uc for uc in user_comps}

        matching_gaps = []
        for cc in course.course_competencies:
            if cc.competency_id in user_comp_map:
                matching_gaps.append(user_comp_map[cc.competency_id])

        priority = "MODERATE"
        reason = f"Added by learner to personalized learning path."
        if matching_gaps:
            top_gap = max(matching_gaps, key=lambda g: g.gap if g.gap is not None else 0.0)
            priority = top_gap.priority or "HIGH"
            comp_name = top_gap.competency.name if top_gap.competency else "core"
            reason = f"Targeted to address {priority.lower()} gap in {comp_name}."

        seq_order = len(active_path.items) + 1

        new_item = LearningPathItem(
            learning_path_id=active_path.id,
            course_id=course.id,
            sequence_order=seq_order,
            status="NOT_STARTED",
            priority=priority,
            reason=reason,
            estimated_duration_hours=course.duration_hours,
        )
        db.add(new_item)
        active_path.estimated_duration_hours = round(
            (active_path.estimated_duration_hours or 0.0) + course.duration_hours, 1
        )
        db.commit()

        # Reload the created item with course relation eagerly loaded
        created_item = (
            db.query(LearningPathItem)
            .options(joinedload(LearningPathItem.course))
            .filter(LearningPathItem.id == new_item.id)
            .first()
        )
        return created_item


learning_path_service = LearningPathService()


