"""Course catalog, competencies, and prerequisites database service."""

from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.competency import Competency
from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.course_prerequisite import CoursePrerequisite
from app.schemas.course import (
    CourseCompetencyCreate,
    CourseCreate,
    CoursePrerequisiteCreate,
    CourseUpdate,
)


class CourseService:
    """Service handling catalog management, competency mapping, and prerequisite dependencies."""

    @staticmethod
    def get_courses(
        db: Session,
        provider: Optional[str] = None,
        domain: Optional[str] = None,
        difficulty: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> List[Course]:
        """Fetch all courses matching given filters with eager loaded relations."""
        query = (
            db.query(Course)
            .options(
                joinedload(Course.course_competencies).joinedload(CourseCompetency.competency),
                joinedload(Course.prerequisites).joinedload(CoursePrerequisite.prerequisite_course),
            )
        )

        if provider:
            query = query.filter(Course.provider.ilike(f"%{provider}%"))
        if domain:
            query = query.filter(Course.domain.ilike(f"%{domain}%"))
        if difficulty:
            query = query.filter(Course.difficulty.ilike(difficulty))
        if is_active is not None:
            query = query.filter(Course.is_active == is_active)
        if search:
            query = query.filter(
                or_(
                    Course.title.ilike(f"%{search}%"),
                    Course.description.ilike(f"%{search}%"),
                    Course.provider.ilike(f"%{search}%"),
                )
            )

        return query.order_by(Course.title.asc()).all()

    @staticmethod
    def get_course(db: Session, course_id: UUID) -> Course:
        """Fetch a single course with all associated competencies and prerequisites or raise 404."""
        course = (
            db.query(Course)
            .options(
                joinedload(Course.course_competencies).joinedload(CourseCompetency.competency),
                joinedload(Course.prerequisites).joinedload(CoursePrerequisite.prerequisite_course),
            )
            .filter(Course.id == course_id)
            .first()
        )
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID '{course_id}' not found.",
            )
        return course

    @staticmethod
    def create_course(db: Session, course_in: CourseCreate) -> Course:
        """Register a new course in the catalog."""
        new_course = Course(
            title=course_in.title,
            description=course_in.description,
            provider=course_in.provider,
            domain=course_in.domain,
            difficulty=course_in.difficulty,
            duration_hours=course_in.duration_hours,
            url=course_in.url,
            is_active=course_in.is_active,
        )
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        return new_course

    @staticmethod
    def update_course(db: Session, course_id: UUID, update_in: CourseUpdate) -> Course:
        """Update fields of an existing course."""
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID '{course_id}' not found.",
            )

        if update_in.title is not None:
            course.title = update_in.title
        if update_in.description is not None:
            course.description = update_in.description
        if update_in.provider is not None:
            course.provider = update_in.provider
        if update_in.domain is not None:
            course.domain = update_in.domain
        if update_in.difficulty is not None:
            course.difficulty = update_in.difficulty
        if update_in.duration_hours is not None:
            course.duration_hours = update_in.duration_hours
        if update_in.url is not None:
            course.url = update_in.url
        if update_in.is_active is not None:
            course.is_active = update_in.is_active

        db.commit()
        db.refresh(course)
        return course

    @staticmethod
    def delete_course(db: Session, course_id: UUID) -> bool:
        """Delete a course and cascade dependent competencies/prerequisites."""
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID '{course_id}' not found.",
            )

        db.delete(course)
        db.commit()
        return True

    @staticmethod
    def assign_course_competency(
        db: Session,
        course_id: UUID,
        comp_in: CourseCompetencyCreate,
    ) -> CourseCompetency:
        """Associate an improved competency with a course."""
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID '{course_id}' not found.",
            )

        competency = db.query(Competency).filter(Competency.id == comp_in.competency_id).first()
        if not competency:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Competency with ID '{comp_in.competency_id}' not found.",
            )

        existing = (
            db.query(CourseCompetency)
            .filter(
                CourseCompetency.course_id == course_id,
                CourseCompetency.competency_id == comp_in.competency_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Competency '{competency.name}' is already assigned to this course.",
            )

        course_comp = CourseCompetency(
            course_id=course_id,
            competency_id=comp_in.competency_id,
            expected_improvement=comp_in.expected_improvement,
        )
        db.add(course_comp)
        db.commit()
        db.refresh(course_comp)
        return course_comp

    @staticmethod
    def add_course_prerequisite(
        db: Session,
        course_id: UUID,
        prereq_in: CoursePrerequisiteCreate,
    ) -> CoursePrerequisite:
        """Add a prerequisite dependency to a course."""
        if course_id == prereq_in.prerequisite_course_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A course cannot require itself as a prerequisite.",
            )

        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with ID '{course_id}' not found.",
            )

        prereq = db.query(Course).filter(Course.id == prereq_in.prerequisite_course_id).first()
        if not prereq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prerequisite course with ID '{prereq_in.prerequisite_course_id}' not found.",
            )

        existing = (
            db.query(CoursePrerequisite)
            .filter(
                CoursePrerequisite.course_id == course_id,
                CoursePrerequisite.prerequisite_course_id == prereq_in.prerequisite_course_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Prerequisite '{prereq.title}' is already assigned to this course.",
            )

        course_prereq = CoursePrerequisite(
            course_id=course_id,
            prerequisite_course_id=prereq_in.prerequisite_course_id,
        )
        db.add(course_prereq)
        db.commit()
        db.refresh(course_prereq)
        return course_prereq


course_service = CourseService()
