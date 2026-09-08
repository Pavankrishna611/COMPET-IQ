"""Verification script for COMPETIQ Backend Part 2 (Database Foundation)."""

import os
import sys
import uuid
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.database.init_db import init_db
from app.database.session import get_db
from app.models import (
    BaseModel,
    Competency,
    Course,
    Department,
    Role,
    RoleCompetencyRequirement,
    User,
    UserCompetency,
)


def test_models_and_tables():
    print("--- 1. Testing Model Registration ---")
    expected_core_tables = {
        "roles",
        "departments",
        "users",
        "competencies",
        "user_competencies",
        "role_competency_requirements",
        "courses",
    }
    actual_tables = set(Base.metadata.tables.keys())
    print(f"Registered tables: {sorted(list(actual_tables))}")
    assert expected_core_tables.issubset(actual_tables), f"Core tables missing! Expected subset {expected_core_tables}, got {actual_tables}"
    print("Table registration verified.")


def test_schema_and_relationships():
    print("\n--- 2. Testing SQLite In-Memory DDL and Relationships ---")
    sqlite_engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=sqlite_engine)
    print("Base.metadata.create_all succeeded on SQLite engine.")

    TestingSession = sessionmaker(bind=sqlite_engine)
    session = TestingSession()

    # Create Role
    role = Role(name="LEARNER", description="Standard learner persona")
    session.add(role)

    # Create Department
    dept = Department(name="Economic Statistics", code="ECON_STAT", description="Economic statistics department")
    session.add(dept)

    # Create User
    user = User(
        official_id="GOV1001",
        email="test.officer@example.gov",
        full_name="Officer Test",
        password_hash="placeholder_hash",
        designation="Junior Statistician",
        experience_years=3.5,
        role=role,
        department=dept,
    )
    session.add(user)

    # Create Competencies
    comp_py = Competency(
        name="Python",
        code="STAT_PY",
        description="Statistical programming in Python",
        domain="Statistical Methods",
        category="Programming",
    )
    comp_sql = Competency(
        name="SQL",
        code="STAT_SQL",
        description="Relational database querying",
        domain="Technical",
        category="Database",
    )
    session.add_all([comp_py, comp_sql])
    session.commit()

    # Create UserCompetency
    user_comp = UserCompetency(
        user=user,
        competency=comp_py,
        current_level=2.5,
        confidence_score=0.88,
        last_assessed_at=datetime.now(timezone.utc),
    )
    session.add(user_comp)

    # Create RoleCompetencyRequirement
    role_req = RoleCompetencyRequirement(
        role=role,
        competency=comp_py,
        required_level=4.0,
        priority="HIGH",
    )
    session.add(role_req)

    # Create Course
    course = Course(
        title="Python for Official Statistics",
        description="Introductory Python course for statistical analysis",
        provider="iGOT Karmayogi",
        domain="Statistical Methods",
        difficulty="Beginner",
        duration_hours=12.5,
        is_active=True,
    )
    session.add(course)
    session.commit()

    # Verify Queries & Relationships
    fetched_user = session.query(User).filter_by(official_id="GOV1001").first()
    assert fetched_user is not None
    assert fetched_user.role.name == "LEARNER"
    assert fetched_user.department.code == "ECON_STAT"
    assert len(fetched_user.user_competencies) == 1
    assert fetched_user.user_competencies[0].competency.name == "Python"
    assert fetched_user.user_competencies[0].current_level == 2.5

    fetched_role = session.query(Role).filter_by(name="LEARNER").first()
    assert len(fetched_role.users) == 1
    assert len(fetched_role.competency_requirements) == 1
    assert fetched_role.competency_requirements[0].required_level == 4.0

    print("All models, relationships, and queries successfully verified.")
    session.close()


def test_get_db_dependency():
    print("\n--- 3. Testing get_db Dependency ---")
    gen = get_db()
    session = next(gen)
    assert session is not None
    try:
        next(gen)
    except StopIteration:
        pass
    print("get_db dependency successfully validated.")


def test_init_db_error_handling():
    print("\n--- 4. Testing init_db Graceful Error Handling ---")
    # When PostgreSQL is not running locally, init_db(raise_on_error=False) should catch the error safely and return False
    result = init_db(raise_on_error=False)
    print(f"init_db(raise_on_error=False) returned: {result} (Gracefully handled without crashing)")


if __name__ == "__main__":
    test_models_and_tables()
    test_schema_and_relationships()
    test_get_db_dependency()
    test_init_db_error_handling()
    print("\n==========================================")
    print("ALL PART 2 VERIFICATIONS PASSED!")
    print("==========================================")
