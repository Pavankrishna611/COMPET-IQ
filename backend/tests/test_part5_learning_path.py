"""Verification test suite for COMPETIQ Backend Part 5 (Learning Path & Recommendation Engine)."""

import os
import sys
import uuid
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.models.competency import Competency
from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.course_prerequisite import CoursePrerequisite
from app.models.learning_path import LearningPath
from app.models.learning_path_item import LearningPathItem
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.schemas.course import (
    CourseCompetencyCreate,
    CourseCreate,
    CoursePrerequisiteCreate,
    CourseUpdate,
)
from app.services.course_service import course_service
from app.services.learning_path_service import learning_path_service
from app.services.recommendation_service import recommendation_service


def test_course_crud_and_dependencies():
    print("--- 1. Testing Course Catalog, Competencies & Prerequisites ---")
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()

    # 1. Create Courses
    c1 = course_service.create_course(
        db,
        CourseCreate(
            title="Python Fundamentals",
            provider="COMPETIQ Learning",
            domain="Technical",
            difficulty="Beginner",
            duration_hours=12.0,
            description="Basics of Python",
        ),
    )
    c2 = course_service.create_course(
        db,
        CourseCreate(
            title="Python for Statistical Analysis",
            provider="iGOT Karmayogi",
            domain="Technical",
            difficulty="Intermediate",
            duration_hours=18.0,
            description="Pandas and NumPy",
        ),
    )

    # 2. Assign Competency
    comp = Competency(name="Python", code="TECH_PY", domain="Technical")
    db.add(comp)
    db.commit()

    cc = course_service.assign_course_competency(
        db,
        c1.id,
        CourseCompetencyCreate(competency_id=comp.id, expected_improvement=1.5),
    )
    assert cc.expected_improvement == 1.5

    # 3. Add Prerequisite: c2 requires c1
    cp = course_service.add_course_prerequisite(
        db,
        c2.id,
        CoursePrerequisiteCreate(prerequisite_course_id=c1.id),
    )
    assert cp.prerequisite_course_id == c1.id

    # Self prerequisite rejected
    try:
        course_service.add_course_prerequisite(
            db,
            c1.id,
            CoursePrerequisiteCreate(prerequisite_course_id=c1.id),
        )
        assert False, "Self prerequisite was not rejected"
    except HTTPException as exc:
        assert exc.status_code == 400
        print("Self-prerequisite dependency properly rejected with 400 Bad Request.")

    # 4. Search & Filters
    results = course_service.get_courses(db, domain="Technical", difficulty="Beginner")
    assert len(results) == 1
    assert results[0].title == "Python Fundamentals"

    db.close()
    print("Course catalog, competency assignment, and prerequisite dependencies passed.")


def test_recommendation_and_learning_path_generation():
    print("\n--- 2. Testing Recommendation Scoring & Learning Path Sequence ---")
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()

    # 1. Setup Role, Competencies, and Requirements
    role = Role(name="LEARNER", description="Standard learner")
    db.add(role)
    db.commit()

    comp_py = Competency(name="Python", code="TECH_PY", domain="Technical")
    comp_sql = Competency(name="SQL", code="TECH_SQL", domain="Technical")
    db.add_all([comp_py, comp_sql])
    db.commit()

    # Requirements: Python -> 4.0, SQL -> 3.5
    req1 = RoleCompetencyRequirement(role_id=role.id, competency_id=comp_py.id, required_level=4.0, priority="HIGH")
    req2 = RoleCompetencyRequirement(role_id=role.id, competency_id=comp_sql.id, required_level=3.5, priority="HIGH")
    db.add_all([req1, req2])
    db.commit()

    # 2. Setup Courses & Prerequisites
    # c_py1: Python Fundamentals (Beginner, 12h)
    c_py1 = Course(title="Python Fundamentals", provider="COMPETIQ Learning", domain="Technical", difficulty="Beginner", duration_hours=12.0)
    # c_py2: Python for Statistical Analysis (Intermediate, 18h) -> requires c_py1
    c_py2 = Course(title="Python for Statistical Analysis", provider="iGOT Karmayogi", domain="Technical", difficulty="Intermediate", duration_hours=18.0)
    # c_sql: SQL for Data Analysis (Intermediate, 15h)
    c_sql = Course(title="SQL for Data Analysis", provider="iGOT Karmayogi", domain="Technical", difficulty="Intermediate", duration_hours=15.0)
    db.add_all([c_py1, c_py2, c_sql])
    db.commit()

    # Competency associations
    db.add_all([
        CourseCompetency(course_id=c_py1.id, competency_id=comp_py.id, expected_improvement=1.5),
        CourseCompetency(course_id=c_py2.id, competency_id=comp_py.id, expected_improvement=2.0),
        CourseCompetency(course_id=c_sql.id, competency_id=comp_sql.id, expected_improvement=1.8),
    ])
    # Prerequisite: c_py2 requires c_py1
    db.add(CoursePrerequisite(course_id=c_py2.id, prerequisite_course_id=c_py1.id))
    db.commit()

    # 3. Create User with Python gap (Level: 2.1 -> Gap: 1.9, CRITICAL) and SQL gap (Level: 3.0 -> Gap: 0.5, MODERATE)
    user = User(
        official_id="EMP9001",
        email="path.learner@example.gov",
        full_name="Alex Path",
        password_hash="secret_pwd",
        role_id=role.id,
    )
    db.add(user)
    db.commit()

    db.add_all([
        UserCompetency(user_id=user.id, competency_id=comp_py.id, current_level=2.1, confidence_score=0.85),
        UserCompetency(user_id=user.id, competency_id=comp_sql.id, current_level=3.0, confidence_score=0.90),
    ])
    db.commit()

    # 4. Check Recommendations
    recs = recommendation_service.get_recommendations_for_user(db, user)
    assert len(recs) >= 2
    # Highest scoring course should address critical Python gap
    assert "Python" in recs[0].matching_competencies[0]
    assert recs[0].recommendation_score >= 70
    print(f"Top recommendation: '{recs[0].course_title}' (Score: {recs[0].recommendation_score}, Reason: {recs[0].reason})")

    # 5. Generate Learning Path
    gen_response = learning_path_service.generate_learning_path(db, user)
    path = gen_response.learning_path

    assert path.status == "ACTIVE"
    assert len(path.items) == 3
    assert path.estimated_duration_hours == 45.0  # 12 + 18 + 15

    # Check Prerequisite Sequence: Python Fundamentals must come before Python for Statistical Analysis!
    item_titles = [item.course.title for item in path.items]
    print(f"Generated learning sequence: {item_titles}")
    idx_fund = item_titles.index("Python Fundamentals")
    idx_adv = item_titles.index("Python for Statistical Analysis")
    assert idx_fund < idx_adv, f"Prerequisite error: Python Fundamentals ({idx_fund}) must precede Advanced ({idx_adv})"
    print("Prerequisite ordering successfully verified.")

    # 6. Update Item Progress
    item_first = path.items[0]
    updated_item = learning_path_service.update_item_status(db, user, item_first.id, "IN_PROGRESS")
    assert updated_item.status == "IN_PROGRESS"

    updated_item = learning_path_service.update_item_status(db, user, item_first.id, "COMPLETED")
    assert updated_item.status == "COMPLETED"
    print("Learning path item progress update verified.")

    # 7. Ownership Validation
    other_user = User(
        official_id="EMP9999",
        email="other@example.gov",
        full_name="Other User",
        password_hash="pwd",
    )
    db.add(other_user)
    db.commit()

    try:
        learning_path_service.update_item_status(db, other_user, item_first.id, "COMPLETED")
        assert False, "Non-owner was able to modify item status"
    except HTTPException as exc:
        assert exc.status_code == 403
        print("Unauthorized learner update properly rejected with 403 Forbidden.")

    # 8. Learning Path Regeneration (Archiving active path)
    new_gen = learning_path_service.generate_learning_path(db, user, force=True)
    assert new_gen.learning_path.status == "ACTIVE"
    assert new_gen.learning_path.id != path.id

    # Check history
    history = learning_path_service.get_learning_path_history(db, user.id)
    assert len(history) == 2
    statuses = [p.status for p in history]
    assert "ARCHIVED" in statuses
    assert "ACTIVE" in statuses
    print("Learning path regeneration and archiving successfully verified.")

    db.close()


if __name__ == "__main__":
    test_course_crud_and_dependencies()
    test_recommendation_and_learning_path_generation()
    print("\n=======================================================")
    print("ALL PART 5 LEARNING PATH & RECOMMENDATION TESTS PASSED!")
    print("=======================================================")
