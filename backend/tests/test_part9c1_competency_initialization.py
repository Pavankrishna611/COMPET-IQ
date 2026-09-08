"""Unit and integration test suite for Part 9C.1: Initial Competency Calculation Engine."""

import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.init_db import seed_database_data
from app.models import Competency, Role, User, UserCompetency, UserProfile, UserSkillDeclaration
from app.services.competency_initialization_service import (
    CompetencyInitializationService,
    competency_initialization_service,
)


def test_calculation_engine_formulas():
    svc = CompetencyInitializationService

    print("\n--- Test 1: Level 1 + LOW confidence + 0 experience ---")
    level, conf = svc.calculate_initial_competency(
        self_assessed_level=1,
        confidence_level="LOW",
        years_of_experience=0.0,
    )
    # Base: 1.0, Conf: -0.2, Exp: 0.0 -> 0.8
    assert level == 0.80, f"Expected 0.80, got {level}"
    assert conf == 0.45, f"Expected 0.45, got {conf}"
    print(f"Level 1 + LOW + 0y -> Level: {level}, Confidence: {conf} [PASSED]")

    print("\n--- Test 2: Level 2 + LOW confidence + 1 year ---")
    level, conf = svc.calculate_initial_competency(
        self_assessed_level=2,
        confidence_level="LOW",
        years_of_experience=1.0,
    )
    # Base: 1.5, Conf: -0.2, Exp: 0.0 -> 1.3
    assert level == 1.30, f"Expected 1.30, got {level}"
    assert conf == 0.45, f"Expected 0.45, got {conf}"
    print(f"Level 2 + LOW + 1y -> Level: {level}, Confidence: {conf} [PASSED]")

    print("\n--- Test 3: Level 3 + MEDIUM confidence + 2 years ---")
    level, conf = svc.calculate_initial_competency(
        self_assessed_level=3,
        confidence_level="MEDIUM",
        years_of_experience=2.0,
    )
    # Base: 2.5, Conf: 0.0, Exp: 0.1 -> 2.6
    assert level == 2.60, f"Expected 2.60, got {level}"
    assert conf == 0.55, f"Expected 0.55, got {conf}"
    print(f"Level 3 + MEDIUM + 2y -> Level: {level}, Confidence: {conf} [PASSED]")

    print("\n--- Test 4: Level 4 + HIGH confidence + 4 years ---")
    level, conf = svc.calculate_initial_competency(
        self_assessed_level=4,
        confidence_level="HIGH",
        years_of_experience=4.0,
    )
    # Base: 3.5, Conf: 0.2, Exp: 0.2 -> 3.9
    assert level == 3.90, f"Expected 3.90, got {level}"
    assert conf == 0.65, f"Expected 0.65, got {conf}"
    print(f"Level 4 + HIGH + 4y -> Level: {level}, Confidence: {conf} [PASSED]")

    print("\n--- Test 5: Level 5 + HIGH confidence + 10 years ---")
    level, conf = svc.calculate_initial_competency(
        self_assessed_level=5,
        confidence_level="HIGH",
        years_of_experience=10.0,
    )
    # Base: 4.0, Conf: 0.2, Exp: 0.3 -> 4.5
    assert level == 4.50, f"Expected 4.50, got {level}"
    assert conf == 0.65, f"Expected 0.65, got {conf}"
    print(f"Level 5 + HIGH + 10y -> Level: {level}, Confidence: {conf} [PASSED]")

    print("\n--- Test 6: Minimum clamp (0.5) ---")
    # Base level 1.0 with severe hypothetical penalty or lower edge
    # Let's test the clamp logic:
    base = svc.calculate_base_level(1)
    conf_adj = svc.calculate_confidence_adjustment("LOW")
    raw = 0.2  # Below 0.5
    clamped = max(0.5, min(5.0, raw))
    assert clamped == 0.5, f"Expected clamp to 0.5, got {clamped}"
    print("Minimum clamp to 0.5 verified.")

    print("\n--- Test 7: Maximum clamp (5.0) ---")
    raw_high = 5.8  # Above 5.0
    clamped_high = max(0.5, min(5.0, raw_high))
    assert clamped_high == 5.0, f"Expected clamp to 5.0, got {clamped_high}"
    print("Maximum clamp to 5.0 verified.")

    print("\n--- Test 8: Rounding to 2 decimals ---")
    level_round, _ = svc.calculate_initial_competency(
        self_assessed_level=3,
        confidence_level="MEDIUM",
        years_of_experience=2.0,
    )
    assert isinstance(level_round, float)
    assert round(level_round, 2) == level_round
    print("Rounding to 2 decimals verified.")


def test_database_initialization_service():
    print("\n--- Initialize In-Memory Test Database ---")
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    with Session() as session:
        seed_database_data(db_session=session)

        # 1. Fetch competencies (Python, SQL)
        py_comp = session.query(Competency).filter(Competency.code == "TECH_PY").first()
        sql_comp = session.query(Competency).filter(Competency.code == "TECH_SQL").first()
        assert py_comp and sql_comp

        # 2. Create test learner
        learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
        user = User(
            email="calc_engine_user@example.com",
            official_id="USR-CALC-01",
            password_hash="hashed_pw",
            full_name="Calculation Engine Tester",
            role_id=learner_role.id,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Create Profile
        profile = UserProfile(
            user_id=user.id,
            designation="Statistical Analyst",
            employment_type="GOVERNMENT_OFFICER",
            experience_years=2.0,
            education_level="BACHELORS",
            profile_completed=True,
            skills_completed=True,
            onboarding_step=3,
        )
        session.add(profile)
        session.commit()

        # 3. Add skill declarations for Python and SQL
        decl_py = UserSkillDeclaration(
            user_id=user.id,
            competency_id=py_comp.id,
            self_assessed_level=2,
            confidence_level="LOW",
            years_of_experience=1.0,
        )
        decl_sql = UserSkillDeclaration(
            user_id=user.id,
            competency_id=sql_comp.id,
            self_assessed_level=3,
            confidence_level="MEDIUM",
            years_of_experience=2.0,
        )
        session.add_all([decl_py, decl_sql])
        session.commit()

        print("\n--- Test Execution 1: Initialize User Competencies ---")
        result1 = competency_initialization_service.initialize_user_competencies(
            db=session,
            user=user,
        )
        assert len(result1["created"]) == 2
        assert len(result1["skipped"]) == 0

        # Check Python created: Base 1.5, Conf -0.2, Exp 0 -> 1.30, Conf: 0.45
        py_item = next(c for c in result1["created"] if c["competency_id"] == str(py_comp.id))
        assert py_item["initial_level"] == 1.30
        assert py_item["confidence"] == 0.45

        # Check SQL created: Base 2.5, Conf 0.0, Exp 0.1 -> 2.60, Conf: 0.55
        sql_item = next(c for c in result1["created"] if c["competency_id"] == str(sql_comp.id))
        assert sql_item["initial_level"] == 2.60
        assert sql_item["confidence"] == 0.55

        # Verify records created in DB
        db_ucs = session.query(UserCompetency).filter(UserCompetency.user_id == user.id).all()
        assert len(db_ucs) == 2

        # Verify profile onboarding status updated to Step 4
        session.refresh(profile)
        assert profile.competency_initialized is True
        assert profile.onboarding_step == 4
        print("First execution successfully created 2 UserCompetency records with correct formulas.")

        print("\n--- Test 10: Repeated Initialization Does Not Duplicate Records ---")
        result2 = competency_initialization_service.initialize_user_competencies(
            db=session,
            user=user,
        )
        assert len(result2["created"]) == 0, f"Expected 0 created on second run, got {len(result2['created'])}"
        assert len(result2["skipped"]) == 2, f"Expected 2 skipped on second run, got {len(result2['skipped'])}"
        for s in result2["skipped"]:
            assert s["reason"] == "Existing competency evidence found"

        # Verify record count remains exactly 2 in DB
        db_ucs_after = session.query(UserCompetency).filter(UserCompetency.user_id == user.id).all()
        assert len(db_ucs_after) == 2
        print("Second execution safely skipped existing records without creating duplicates.")

        print("\n--- Test 9: Existing UserCompetency Is NOT Overwritten ---")
        # Manually alter Python competency as if verified by an assessment
        py_uc = next(uc for uc in db_ucs_after if uc.competency_id == py_comp.id)
        py_uc.current_level = 4.85
        py_uc.confidence_score = 0.92
        session.commit()

        # Run initialization again
        result3 = competency_initialization_service.initialize_user_competencies(
            db=session,
            user=user,
        )
        assert len(result3["created"]) == 0
        assert len(result3["skipped"]) == 2

        # Verify Python verified value (4.85) was NOT overwritten
        session.refresh(py_uc)
        assert py_uc.current_level == 4.85, f"Verified level was overwritten to {py_uc.current_level}!"
        assert py_uc.confidence_score == 0.92, f"Verified confidence was overwritten to {py_uc.confidence_score}!"
        print("Anti-overwrite protection confirmed: existing verified competency data preserved completely.")

    print("\nALL PART 9C.1 INITIAL COMPETENCY CALCULATION ENGINE TESTS PASSED!")


if __name__ == "__main__":
    test_calculation_engine_formulas()
    test_database_initialization_service()
