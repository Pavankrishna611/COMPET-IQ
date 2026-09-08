"""Verification test suite for COMPETIQ Backend Part 4 (Competency Engine & Skill Gap Analysis)."""

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
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.schemas.competency import (
    CompetencyCreate,
    CompetencyUpdate,
    RoleCompetencyRequirementCreate,
    RoleCompetencyRequirementUpdate,
    UserCompetencyCreate,
    UserCompetencyUpdate,
)
from app.services.competency_service import competency_service
from app.services.skill_gap_service import skill_gap_service


def test_gap_calculation_and_classification_thresholds():
    print("--- 1. Testing Core Calculation, Priority Brackets & Strong Detection ---")

    # Test Case 1: Gap = 1.9 -> CRITICAL
    gap1 = skill_gap_service.calculate_skill_gap(2.1, 4.0)
    prio1 = skill_gap_service.classify_gap_priority(gap1)
    strong1 = skill_gap_service.is_strong_competency(2.1, 4.0)
    assert gap1 == 1.9, f"Expected gap 1.9, got {gap1}"
    assert prio1 == "CRITICAL", f"Expected CRITICAL, got {prio1}"
    assert strong1 is False

    # Test Case 2: Gap = 1.0 -> HIGH
    gap2 = skill_gap_service.calculate_skill_gap(3.0, 4.0)
    prio2 = skill_gap_service.classify_gap_priority(gap2)
    strong2 = skill_gap_service.is_strong_competency(3.0, 4.0)
    assert gap2 == 1.0, f"Expected gap 1.0, got {gap2}"
    assert prio2 == "HIGH", f"Expected HIGH, got {prio2}"
    assert strong2 is False

    # Test Case 3: Gap = 0.6 -> MODERATE
    gap3 = skill_gap_service.calculate_skill_gap(3.4, 4.0)
    prio3 = skill_gap_service.classify_gap_priority(gap3)
    strong3 = skill_gap_service.is_strong_competency(3.4, 4.0)
    assert gap3 == 0.6, f"Expected gap 0.6, got {gap3}"
    assert prio3 == "MODERATE", f"Expected MODERATE, got {prio3}"
    assert strong3 is False

    # Test Case 4: Gap = 0.2 -> LOW
    gap4 = skill_gap_service.calculate_skill_gap(3.8, 4.0)
    prio4 = skill_gap_service.classify_gap_priority(gap4)
    strong4 = skill_gap_service.is_strong_competency(3.8, 4.0)
    assert gap4 == 0.2, f"Expected gap 0.2, got {gap4}"
    assert prio4 == "LOW", f"Expected LOW, got {prio4}"
    assert strong4 is False

    # Test Case 5: Gap = 0.0 -> NONE, Strong = True
    gap5 = skill_gap_service.calculate_skill_gap(4.2, 4.0)
    prio5 = skill_gap_service.classify_gap_priority(gap5)
    strong5 = skill_gap_service.is_strong_competency(4.2, 4.0)
    assert gap5 == 0.0, f"Expected gap 0.0, got {gap5}"
    assert prio5 == "NONE", f"Expected NONE, got {prio5}"
    assert strong5 is True

    print("All calculation, priority, and strong competency tests passed.")


def test_competency_crud_and_user_evaluations():
    print("\n--- 2. Testing Competency Catalog & User Profile Services ---")
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()

    # 1. Create Competencies
    comp_in = CompetencyCreate(
        name="Python",
        code="TECH_PY",
        domain="Technical",
        category="Programming",
        description="Statistical programming in Python",
    )
    comp = competency_service.create_competency(db, comp_in)
    assert comp.name == "Python"
    assert comp.code == "TECH_PY"

    # Duplicate code rejected
    try:
        competency_service.create_competency(db, comp_in)
        assert False, "Duplicate competency code was not rejected"
    except HTTPException as exc:
        assert exc.status_code == 400
        print("Duplicate competency code rejected with 400 Bad Request.")

    # 2. Filter / Search
    comps = competency_service.get_all_competencies(db, domain="Technical")
    assert len(comps) == 1

    # 3. Create User & Assign Competency
    role = Role(name="LEARNER", description="Learner")
    db.add(role)
    db.commit()

    user = User(
        official_id="GOV2001",
        email="learner.test@example.gov",
        full_name="Gov Analyst",
        password_hash="hashed_secret",
        role_id=role.id,
    )
    db.add(user)
    db.commit()

    eval_in = UserCompetencyCreate(
        competency_id=comp.id,
        current_level=2.1,
        confidence_score=0.85,
    )
    user_comp = competency_service.create_user_competency(db, user.id, eval_in)
    assert user_comp.current_level == 2.1
    assert user_comp.confidence_score == 0.85

    # Duplicate assignment rejected
    try:
        competency_service.create_user_competency(db, user.id, eval_in)
        assert False, "Duplicate user competency was not rejected"
    except HTTPException as exc:
        assert exc.status_code == 409
        print("Duplicate competency assignment rejected with 409 Conflict.")

    # 4. Update Evaluation
    update_in = UserCompetencyUpdate(current_level=3.5, confidence_score=0.92)
    updated_comp = competency_service.update_user_competency(db, user.id, comp.id, update_in)
    assert updated_comp.current_level == 3.5

    db.close()
    print("Competency catalog and user profile evaluations passed.")


def test_complete_skill_gap_analysis_flow():
    print("\n--- 3. Testing Complete Skill Gap Analysis Engine ---")
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()

    # Create Role & Competencies
    role = Role(name="Statistical Investigator", description="Survey analyst")
    db.add(role)
    db.commit()

    c1 = Competency(name="Python", code="TECH_PY", domain="Technical")
    c2 = Competency(name="SQL", code="TECH_SQL", domain="Technical")
    c3 = Competency(name="Data Visualization", code="TECH_VIZ", domain="Technical")
    c4 = Competency(name="Sampling", code="STAT_SAMPLING", domain="Statistical Methods")
    c5 = Competency(name="Data Quality", code="STAT_QUALITY", domain="Statistical Methods")
    db.add_all([c1, c2, c3, c4, c5])
    db.commit()

    # Define Role Requirements
    # c1: Required 4.0
    # c2: Required 3.5
    # c3: Required 4.0
    # c4: Required 4.0
    # c5: Required 4.0
    r1 = RoleCompetencyRequirement(role_id=role.id, competency_id=c1.id, required_level=4.0, priority="HIGH")
    r2 = RoleCompetencyRequirement(role_id=role.id, competency_id=c2.id, required_level=3.5, priority="HIGH")
    r3 = RoleCompetencyRequirement(role_id=role.id, competency_id=c3.id, required_level=4.0, priority="CRITICAL")
    r4 = RoleCompetencyRequirement(role_id=role.id, competency_id=c4.id, required_level=4.0, priority="HIGH")
    r5 = RoleCompetencyRequirement(role_id=role.id, competency_id=c5.id, required_level=4.0, priority="CRITICAL")
    db.add_all([r1, r2, r3, r4, r5])
    db.commit()

    # Create User with designated evaluations:
    # c1 (Python): 2.1 (Required 4.0 -> Gap 1.9, CRITICAL)
    # c2 (SQL): 3.0 (Required 3.5 -> Gap 0.5, MODERATE)
    # c3 (Viz): 3.8 (Required 4.0 -> Gap 0.2, LOW)
    # c4 (Sampling): 4.5 (Required 4.0 -> Gap 0.0, NONE, Strong = True)
    # c5 (Data Quality): Not evaluated -> Current 0.0 (Required 4.0 -> Gap 4.0, CRITICAL)
    user = User(
        official_id="STAT888",
        email="stat.lead@example.gov",
        full_name="Lead Investigator",
        password_hash="secure_hash",
        role_id=role.id,
    )
    db.add(user)
    db.commit()

    uc1 = UserCompetency(user_id=user.id, competency_id=c1.id, current_level=2.1, confidence_score=0.85)
    uc2 = UserCompetency(user_id=user.id, competency_id=c2.id, current_level=3.0, confidence_score=0.90)
    uc3 = UserCompetency(user_id=user.id, competency_id=c3.id, current_level=3.8, confidence_score=0.80)
    uc4 = UserCompetency(user_id=user.id, competency_id=c4.id, current_level=4.5, confidence_score=0.95)
    db.add_all([uc1, uc2, uc3, uc4])
    db.commit()

    # Execute Analysis
    analysis = skill_gap_service.analyze_user_skill_gaps(db, user)

    assert analysis.user_id == user.id
    assert analysis.role == "Statistical Investigator"
    assert analysis.summary.total_competencies == 5
    assert analysis.summary.critical_gaps == 2, f"Expected 2 critical gaps, got {analysis.summary.critical_gaps}"
    assert analysis.summary.moderate_gaps == 1, f"Expected 1 moderate gap, got {analysis.summary.moderate_gaps}"
    assert analysis.summary.low_priority_gaps == 1, f"Expected 1 low gap, got {analysis.summary.low_priority_gaps}"
    assert analysis.summary.strong_competencies == 1, f"Expected 1 strong competency, got {analysis.summary.strong_competencies}"

    print("Personalized skill gap analysis successfully validated.")

    # Test Organizational Summary
    org_summary = skill_gap_service.get_organization_summary(db)
    assert org_summary.total_users_analyzed == 1
    assert len(org_summary.top_skill_gaps) >= 1
    print(f"Top organizational gap: {org_summary.top_skill_gaps[0].competency} (avg: {org_summary.top_skill_gaps[0].average_gap})")
    print("Organizational skill gap summary successfully validated.")

    db.close()


if __name__ == "__main__":
    test_gap_calculation_and_classification_thresholds()
    test_competency_crud_and_user_evaluations()
    test_complete_skill_gap_analysis_flow()
    print("\n=======================================================")
    print("ALL PART 4 COMPETENCY & SKILL GAP ENGINE TESTS PASSED!")
    print("=======================================================")
