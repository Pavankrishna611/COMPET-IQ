"""Unified server-side search service across courses, competencies, assessments, learning paths, and study resources."""

import logging
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.assessment import Assessment
from app.models.assessment_assignment import AssessmentAssignment
from app.models.competency import Competency
from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.learning_material import LearningMaterial
from app.models.learning_path import LearningPath
from app.models.user import User
from app.schemas.search import SearchResponse, SearchResultItem

logger = logging.getLogger("competiq")


class SearchService:
    """Service providing unified, role-aware, relevance-ranked global search."""

    @staticmethod
    def search(
        db: Session,
        query: str,
        current_user: User,
        category_filter: Optional[str] = None,
        limit: int = 20,
    ) -> SearchResponse:
        """Perform multi-entity search with role-based visibility and relevance scoring."""
        trimmed_query = (query or "").strip()
        if not trimmed_query or len(trimmed_query) < 2:
            return SearchResponse(
                query=trimmed_query,
                total_results=0,
                results=[],
                category_counts={},
            )

        q_lower = trimmed_query.lower()
        role_name = current_user.role.name.upper() if current_user.role else "LEARNER"
        is_learner = role_name == "LEARNER"
        is_trainer = role_name == "TRAINER"
        is_admin = role_name == "ADMIN"

        all_results: List[SearchResultItem] = []
        category_counts: Dict[str, int] = {
            "course": 0,
            "competency": 0,
            "assessment": 0,
            "learning_path": 0,
            "material": 0,
        }

        # ---------------------------------------------------------------------
        # 1. Search Courses
        # ---------------------------------------------------------------------
        if not category_filter or category_filter == "course":
            courses = (
                db.query(Course)
                .options(
                    joinedload(Course.course_competencies).joinedload(CourseCompetency.competency)
                )
                .filter(Course.is_active == True)
                .all()
            )

            for course in courses:
                score = 0.0
                t_lower = (course.title or "").lower()
                d_lower = (course.description or "").lower()
                p_lower = (course.provider or "").lower()
                dom_lower = (course.domain or "").lower()

                # Title relevance
                if t_lower == q_lower:
                    score = max(score, 100.0)
                elif t_lower.startswith(q_lower):
                    score = max(score, 85.0)
                elif q_lower in t_lower:
                    score = max(score, 70.0)

                # Skill / Competency mapping relevance
                matched_skill = None
                for cc in course.course_competencies:
                    if cc.competency:
                        c_name = (cc.competency.name or "").lower()
                        c_code = (cc.competency.code or "").lower()
                        if q_lower in c_name or q_lower in c_code:
                            score = max(score, 60.0)
                            matched_skill = cc.competency.name
                            break

                # Provider / Domain relevance
                if q_lower in p_lower or q_lower in dom_lower:
                    score = max(score, 45.0)

                # Description relevance
                if q_lower in d_lower:
                    score = max(score, 30.0)

                if score > 0:
                    category_counts["course"] += 1
                    subtitle = f"{course.provider} • {course.domain} • {course.difficulty}"
                    if matched_skill:
                        subtitle += f" • Skill: {matched_skill}"

                    all_results.append(
                        SearchResultItem(
                            id=str(course.id),
                            title=course.title,
                            subtitle=subtitle,
                            category="course",
                            category_label="Course",
                            description=course.description,
                            badge=course.provider,
                            url=f"/learner/courses/{course.id}",
                            score=score,
                        )
                    )

        # ---------------------------------------------------------------------
        # 2. Search Competencies
        # ---------------------------------------------------------------------
        if not category_filter or category_filter == "competency":
            competencies = db.query(Competency).all()

            for comp in competencies:
                score = 0.0
                n_lower = (comp.name or "").lower()
                c_lower = (comp.code or "").lower()
                d_lower = (comp.description or "").lower()
                dom_lower = (comp.domain or "").lower()
                cat_lower = (comp.category or "").lower() if comp.category else ""

                if n_lower == q_lower:
                    score = max(score, 100.0)
                elif c_lower == q_lower:
                    score = max(score, 95.0)
                elif n_lower.startswith(q_lower):
                    score = max(score, 85.0)
                elif c_lower.startswith(q_lower):
                    score = max(score, 80.0)
                elif q_lower in n_lower or q_lower in c_lower:
                    score = max(score, 70.0)
                elif q_lower in dom_lower or q_lower in cat_lower:
                    score = max(score, 45.0)
                elif q_lower in d_lower:
                    score = max(score, 25.0)

                if score > 0:
                    category_counts["competency"] += 1
                    comp_url = (
                        "/admin/workforce"
                        if is_admin
                        else "/trainer/question-bank"
                        if is_trainer
                        else "/learner/competencies"
                    )

                    all_results.append(
                        SearchResultItem(
                            id=str(comp.id),
                            title=comp.name,
                            subtitle=f"{comp.code} • {comp.domain}",
                            category="competency",
                            category_label="Competency",
                            description=comp.description,
                            badge=comp.domain,
                            url=comp_url,
                            score=score,
                        )
                    )

        # ---------------------------------------------------------------------
        # 3. Search Assessments
        # ---------------------------------------------------------------------
        if not category_filter or category_filter == "assessment":
            query_assess = db.query(Assessment)

            if is_learner:
                # Learners can see published assessments
                query_assess = query_assess.filter(Assessment.status == "PUBLISHED")

            assessments = query_assess.all()

            for ass in assessments:
                score = 0.0
                t_lower = (ass.title or "").lower()
                d_lower = (ass.description or "").lower()
                diff_lower = (ass.difficulty or "").lower()

                if t_lower == q_lower:
                    score = max(score, 100.0)
                elif t_lower.startswith(q_lower):
                    score = max(score, 85.0)
                elif q_lower in t_lower:
                    score = max(score, 70.0)
                elif q_lower in diff_lower:
                    score = max(score, 40.0)
                elif q_lower in d_lower:
                    score = max(score, 30.0)

                if score > 0:
                    category_counts["assessment"] += 1
                    ass_url = (
                        "/trainer/assessments"
                        if (is_trainer or is_admin)
                        else "/learner/assessments"
                    )

                    all_results.append(
                        SearchResultItem(
                            id=str(ass.id),
                            title=ass.title,
                            subtitle=f"{ass.difficulty.capitalize()} • {ass.duration_minutes} mins • {ass.status.capitalize()}",
                            category="assessment",
                            category_label="Assessment",
                            description=ass.description,
                            badge=ass.difficulty.capitalize(),
                            url=ass_url,
                            score=score,
                        )
                    )

        # ---------------------------------------------------------------------
        # 4. Search Learning Paths
        # ---------------------------------------------------------------------
        if not category_filter or category_filter == "learning_path":
            query_lp = db.query(LearningPath)
            if is_learner:
                query_lp = query_lp.filter(LearningPath.user_id == current_user.id)

            learning_paths = query_lp.all()

            for lp in learning_paths:
                score = 0.0
                t_lower = (lp.title or "").lower()
                d_lower = (lp.description or "").lower()
                tr_lower = (lp.target_role or "").lower()

                if t_lower == q_lower:
                    score = max(score, 100.0)
                elif t_lower.startswith(q_lower):
                    score = max(score, 85.0)
                elif q_lower in t_lower:
                    score = max(score, 70.0)
                elif q_lower in tr_lower:
                    score = max(score, 50.0)
                elif q_lower in d_lower:
                    score = max(score, 30.0)

                if score > 0:
                    category_counts["learning_path"] += 1
                    all_results.append(
                        SearchResultItem(
                            id=str(lp.id),
                            title=lp.title,
                            subtitle=f"Target: {lp.target_role} • {lp.status.capitalize()}",
                            category="learning_path",
                            category_label="Learning Path",
                            description=lp.description,
                            badge="Trajectory",
                            url="/learner/learning-path",
                            score=score,
                        )
                    )

        # ---------------------------------------------------------------------
        # 5. Search Learning Materials / Resources
        # ---------------------------------------------------------------------
        if not category_filter or category_filter == "material":
            query_mat = db.query(LearningMaterial)
            if is_learner:
                query_mat = query_mat.filter(
                    (LearningMaterial.is_approved == True)
                    | (LearningMaterial.uploaded_by == current_user.id)
                )

            materials = query_mat.all()

            for mat in materials:
                score = 0.0
                t_lower = (mat.title or "").lower()
                f_lower = (mat.original_filename or "").lower()
                mt_lower = (mat.material_type or "").lower()

                if t_lower == q_lower or f_lower == q_lower:
                    score = max(score, 100.0)
                elif t_lower.startswith(q_lower) or f_lower.startswith(q_lower):
                    score = max(score, 85.0)
                elif q_lower in t_lower or q_lower in f_lower:
                    score = max(score, 70.0)
                elif q_lower in mt_lower:
                    score = max(score, 40.0)

                if score > 0:
                    category_counts["material"] += 1
                    mat_url = (
                        "/trainer/assessment-generator"
                        if (is_trainer or is_admin)
                        else "/learner/quiz-generator"
                    )

                    all_results.append(
                        SearchResultItem(
                            id=str(mat.id),
                            title=mat.title,
                            subtitle=f"{mat.material_type} • {mat.file_type.upper()}",
                            category="material",
                            category_label="Resource",
                            description=f"File: {mat.original_filename}",
                            badge=mat.file_type.upper(),
                            url=mat_url,
                            score=score,
                        )
                    )

        # Sort results by score DESC, then title ASC
        all_results.sort(key=lambda item: (-item.score, item.title.lower()))

        total_count = len(all_results)
        bounded_results = all_results[: max(1, min(limit, 50))]

        return SearchResponse(
            query=trimmed_query,
            total_results=total_count,
            results=bounded_results,
            category_counts=category_counts,
        )


search_service = SearchService()
