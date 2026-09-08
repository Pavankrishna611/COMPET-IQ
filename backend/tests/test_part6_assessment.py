"""Automated test suite for Backend Part 6: Assessment, Quiz, Scoring & Competency Update Engine."""

import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.security import create_access_token, hash_password
from app.database.base import Base
from app.database.init_db import seed_database_data
from app.database.session import get_db
from app.main import app
from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.competency import Competency
from app.models.question import Question
from app.models.question_attempt import QuestionAttempt
from app.models.role import Role
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.services.competency_update_service import (
    calculate_updated_level,
    percentage_to_evidence_level,
)

# In-memory SQLite engine for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_module():
    """Create in-memory SQLite schema and seed standard reference data."""
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)


def test_part6_competency_update_math():
    """Test the evidence mapping and weighted average competency update formula."""
    print("\n--- 1. Testing Competency Update Math & Evidence Levels ---")

    # Evidence levels
    assert percentage_to_evidence_level(0.0) == 1.0
    assert percentage_to_evidence_level(15.0) == 1.0
    assert percentage_to_evidence_level(20.0) == 1.0
    assert percentage_to_evidence_level(25.0) == 2.0
    assert percentage_to_evidence_level(40.0) == 2.0
    assert percentage_to_evidence_level(55.0) == 3.0
    assert percentage_to_evidence_level(60.0) == 3.0
    assert percentage_to_evidence_level(75.0) == 4.0
    assert percentage_to_evidence_level(80.0) == 4.0
    assert percentage_to_evidence_level(85.0) == 5.0
    assert percentage_to_evidence_level(100.0) == 5.0

    # Weighted formula: (2.1 * 0.7) + (4.0 * 0.3) = 1.47 + 1.20 = 2.67
    new_lvl = calculate_updated_level(2.1, 4.0)
    assert new_lvl == 2.67, f"Expected 2.67, got {new_lvl}"

    # Clamping bounds: 0.0 to 5.0
    assert calculate_updated_level(5.0, 5.0) == 5.0
    assert calculate_updated_level(0.0, 1.0) == 0.30

    print("Competency update math and evidence mapping verified.")


def test_part6_seed_assessments_and_questions():
    """Verify that demo assessments and educational questions are correctly seeded in the database."""
    print("\n--- 2. Testing Seeded Demo Assessments & Questions ---")
    with TestingSessionLocal() as session:
        assessments = session.query(Assessment).all()
        titles = [a.title for a in assessments]
        print(f"Seeded assessments ({len(assessments)}): {titles}")

        assert "Python Fundamentals Assessment" in titles
        assert "Sampling Techniques Assessment" in titles
        assert "Data Quality Fundamentals" in titles

        py_ass = session.query(Assessment).filter(Assessment.title == "Python Fundamentals Assessment").first()
        assert py_ass is not None
        assert py_ass.status == "PUBLISHED"
        assert len(py_ass.questions) == 10

        sampling_ass = session.query(Assessment).filter(Assessment.title == "Sampling Techniques Assessment").first()
        assert sampling_ass is not None
        assert len(sampling_ass.questions) == 8

        dq_ass = session.query(Assessment).filter(Assessment.title == "Data Quality Fundamentals").first()
        assert dq_ass is not None
        assert len(dq_ass.questions) == 5

    print("Demo assessments and questions seeding successfully verified.")


def test_part6_assessment_lifecycle_and_security():
    """Test full assessment authoring lifecycle: creation, questions, publishing, and RBAC security."""
    print("\n--- 3. Testing Assessment Authoring Lifecycle & RBAC ---")
    with TestingSessionLocal() as session:
        trainer_role = session.query(Role).filter(Role.name == "TRAINER").first()
        learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
        comp_py = session.query(Competency).filter(Competency.code == "TECH_PY").first()

        # Create Trainer user
        trainer = User(
            official_id="TR-202",
            email="trainer202@competiq.org",
            full_name="Dr. Rita Trainer",
            password_hash=hash_password("TrainerPass123!"),
            role_id=trainer_role.id,
            is_active=True,
        )
        # Create Learner user
        learner = User(
            official_id="LR-303",
            email="learner303@competiq.org",
            full_name="Pavan Learner",
            password_hash=hash_password("LearnerPass123!"),
            role_id=learner_role.id,
            is_active=True,
        )
        session.add_all([trainer, learner])
        session.commit()
        session.refresh(trainer)
        session.refresh(learner)

        trainer_id = trainer.id
        learner_id = learner.id
        comp_py_id = comp_py.id

    trainer_token = create_access_token(subject=str(trainer_id), role="TRAINER")
    learner_token = create_access_token(subject=str(learner_id), role="LEARNER")

    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 1. Learner tries to create assessment -> 403 Forbidden
    res = client.post(
        "/api/v1/assessments",
        json={
            "title": "Unauthorized Test",
            "duration_minutes": 15,
            "difficulty": "BEGINNER",
        },
        headers=learner_headers,
    )
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 2. Trainer creates draft assessment
    res = client.post(
        "/api/v1/assessments",
        json={
            "title": "Custom Advanced Statistics Quiz",
            "description": "Custom quiz created by Trainer.",
            "duration_minutes": 20,
            "difficulty": "INTERMEDIATE",
        },
        headers=trainer_headers,
    )
    assert res.status_code == 201, f"Expected 201, got {res.text}"
    created_ass = res.json()
    ass_id = created_ass["id"]
    assert created_ass["status"] == "DRAFT"

    # 3. Learner should NOT see DRAFT assessment in list
    res = client.get("/api/v1/assessments", headers=learner_headers)
    assert res.status_code == 200
    listed_titles = [a["title"] for a in res.json()]
    assert "Custom Advanced Statistics Quiz" not in listed_titles

    # 4. Trainer attempts to publish with 0 questions -> 400 Bad Request
    res = client.post(f"/api/v1/assessments/{ass_id}/publish", headers=trainer_headers)
    assert res.status_code == 400
    assert "at least one question" in res.json()["error"]["message"]

    # 5. Trainer adds question to assessment
    res = client.post(
        f"/api/v1/assessments/{ass_id}/questions",
        json={
            "competency_id": str(comp_py_id),
            "question_text": "What is Python's standard package manager?",
            "question_type": "MCQ",
            "difficulty": "EASY",
            "option_a": "pip",
            "option_b": "npm",
            "option_c": "cargo",
            "option_d": "gem",
            "correct_option": "A",
            "explanation": "pip is the reference package installer for Python.",
            "points": 2.0,
            "sequence_order": 1,
        },
        headers=trainer_headers,
    )
    assert res.status_code == 201, f"Expected 201, got {res.text}"
    q_data = res.json()
    assert q_data["correct_option"] == "A"
    assert q_data["points"] == 2.0

    # 6. Learner tries to start DRAFT assessment -> 400 Bad Request
    res = client.post(f"/api/v1/quiz/{ass_id}/start", headers=learner_headers)
    assert res.status_code == 400
    assert "unpublished" in res.json()["error"]["message"]

    # 7. Trainer publishes assessment
    res = client.post(f"/api/v1/assessments/{ass_id}/publish", headers=trainer_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "PUBLISHED"

    # 8. Learner views assessment details -> MUST NOT include correct_option or explanation
    res = client.get(f"/api/v1/assessments/{ass_id}", headers=learner_headers)
    assert res.status_code == 200
    detail = res.json()
    assert len(detail["questions"]) == 1
    learner_q = detail["questions"][0]
    assert "correct_option" not in learner_q
    assert "explanation" not in learner_q

    print("Assessment authoring, publication, and security checks passed.")


def test_part6_quiz_flow_scoring_and_competency_update():
    """Test full learner quiz flow: start, save answer, submit, evaluate, unlock review, and update profile."""
    print("\n--- 4. Testing Quiz Flow, Automatic Scoring & Competency Update ---")
    with TestingSessionLocal() as session:
        learner = session.query(User).filter(User.official_id == "LR-303").first()
        comp_py = session.query(Competency).filter(Competency.code == "TECH_PY").first()

        # Set initial user competency level for Python to 2.1
        user_comp = (
            session.query(UserCompetency)
            .filter(
                UserCompetency.user_id == learner.id,
                UserCompetency.competency_id == comp_py.id,
            )
            .first()
        )
        if not user_comp:
            user_comp = UserCompetency(
                user_id=learner.id,
                competency_id=comp_py.id,
                current_level=2.1,
                confidence_score=0.5,
            )
            session.add(user_comp)
        else:
            user_comp.current_level = 2.1
        learner_id = learner.id
        comp_py_id = comp_py.id
        session.commit()

        # Target Python Fundamentals Assessment (10 questions)
        py_ass = session.query(Assessment).filter(Assessment.title == "Python Fundamentals Assessment").first()
        ass_id = py_ass.id
        questions = (
            session.query(Question)
            .filter(Question.assessment_id == ass_id)
            .order_by(Question.sequence_order.asc())
            .all()
        )
        q_answer_map = {q.id: q.correct_option for q in questions}

    learner_token = create_access_token(subject=str(learner_id), role="LEARNER")
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 1. Start quiz
    res = client.post(f"/api/v1/quiz/{ass_id}/start", headers=learner_headers)
    assert res.status_code == 200, f"Expected 200, got {res.text}"
    quiz_data = res.json()
    attempt_id = quiz_data["attempt_id"]
    quiz_questions = quiz_data["questions"]
    assert len(quiz_questions) == 10

    # Verify learner cannot see answers
    for q in quiz_questions:
        assert "correct_option" not in q
        assert "explanation" not in q

    # 2. Save individual answer for Question 1
    q1_id = quiz_questions[0]["id"]
    q1_correct = q_answer_map[uuid.UUID(q1_id)]
    res = client.post(
        f"/api/v1/quiz/attempts/{attempt_id}/answer",
        json={"question_id": q1_id, "selected_option": q1_correct},
        headers=learner_headers,
    )
    assert res.status_code == 200

    # 3. Retrieve active quiz state
    res = client.get(f"/api/v1/quiz/attempts/{attempt_id}", headers=learner_headers)
    assert res.status_code == 200
    active_state = res.json()
    assert active_state["status"] == "IN_PROGRESS"
    assert active_state["saved_answers"][q1_id] == q1_correct

    # 4. Answer 8 out of 10 questions correctly (80% score)
    # Questions 1 to 8: correct answer
    # Questions 9 to 10: intentionally wrong answer
    answers_payload = []
    for i, q in enumerate(quiz_questions):
        qid = uuid.UUID(q["id"])
        corr = q_answer_map[qid]
        if i < 8:
            selected = corr
        else:
            # Pick a wrong option
            selected = "D" if corr != "D" else "C"
        answers_payload.append({"question_id": str(qid), "selected_option": selected})

    # 5. Submit quiz
    res = client.post(
        f"/api/v1/quiz/attempts/{attempt_id}/submit",
        json={"answers": answers_payload},
        headers=learner_headers,
    )
    assert res.status_code == 200, f"Expected 200, got {res.text}"
    result = res.json()

    assert result["total_questions"] == 10
    assert result["correct_answers"] == 8
    assert result["incorrect_answers"] == 2
    assert result["percentage"] == 80.0
    assert result["score"] == 8.0

    # 6. Verify Competency breakdown
    breakdown = result["competency_breakdown"]
    assert len(breakdown) >= 1
    py_stat = next(b for b in breakdown if b["competency_name"] == "Python")
    assert py_stat["total_questions"] == 10
    assert py_stat["correct_answers"] == 8
    assert py_stat["percentage"] == 80.0

    # 7. Verify Question Review unlocked after submission
    review = result["question_review"]
    assert len(review) == 10
    for r in review:
        assert "correct_option" in r
        assert "explanation" in r
        assert "is_correct" in r
        assert "points_earned" in r

    # 8. Verify Competency Profile update
    # Old Python level: 2.1
    # 80% score -> evidence level 4.0
    # Formula: (2.1 * 0.7) + (4.0 * 0.3) = 1.47 + 1.20 = 2.67
    with TestingSessionLocal() as session:
        updated_comp = (
            session.query(UserCompetency)
            .filter(
                UserCompetency.user_id == learner_id,
                UserCompetency.competency_id == comp_py_id,
            )
            .first()
        )
        assert updated_comp is not None
        print(f"Updated Python competency level: {updated_comp.current_level} (confidence: {updated_comp.confidence_score})")
        assert updated_comp.current_level == 2.67, f"Expected 2.67, got {updated_comp.current_level}"
        assert updated_comp.last_assessed_at is not None

    # 9. Verify GET /api/v1/competencies/me returns updated level 2.67
    res = client.get("/api/v1/competencies/me", headers=learner_headers)
    assert res.status_code == 200
    user_comps = res.json()
    py_profile = next(c for c in user_comps if c["competency_name"] == "Python")
    assert py_profile["current_level"] == 2.67

    # 10. Verify attempt history
    res = client.get("/api/v1/quiz/my-attempts", headers=learner_headers)
    assert res.status_code == 200
    history = res.json()
    assert len(history) >= 1
    assert history[0]["percentage"] == 80.0
    assert history[0]["status"] == "EVALUATED"

    # 11. Verify double submission is rejected
    res = client.post(f"/api/v1/quiz/attempts/{attempt_id}/submit", headers=learner_headers)
    assert res.status_code == 400
    assert "already been evaluated" in res.json()["error"]["message"]

    print("Quiz submission, objective evaluation, and competency update successfully verified.")


def test_part6_trainer_analytics_and_attempt_deletion_guard():
    """Verify trainer analytics aggregation and safeguard against deleting assessments with active attempts."""
    print("\n--- 5. Testing Trainer Analytics & Attempt Deletion Guard ---")
    with TestingSessionLocal() as session:
        trainer = session.query(User).filter(User.official_id == "TR-202").first()
        py_ass = session.query(Assessment).filter(Assessment.title == "Python Fundamentals Assessment").first()
        trainer_id = trainer.id
        ass_id = py_ass.id

    trainer_token = create_access_token(subject=str(trainer_id), role="TRAINER")
    trainer_headers = {"Authorization": f"Bearer {trainer_token}"}

    # 1. Get analytics
    res = client.get(f"/api/v1/assessments/{ass_id}/results", headers=trainer_headers)
    assert res.status_code == 200, f"Expected 200, got {res.text}"
    analytics = res.json()
    assert analytics["total_attempts"] >= 1
    assert analytics["average_percentage"] > 0
    print(f"Assessment analytics: Total attempts: {analytics['total_attempts']}, Avg %: {analytics['average_percentage']}%")

    # 2. Non-creator trainer cannot delete unowned assessment -> 403 Forbidden
    res = client.delete(f"/api/v1/assessments/{ass_id}", headers=trainer_headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # 3. Admin attempting to delete assessment with existing attempts -> 400 Bad Request
    with TestingSessionLocal() as session:
        admin_role = session.query(Role).filter(Role.name == "ADMIN").first()
        admin = User(
            official_id="ADM-808",
            email="admin808@competiq.org",
            full_name="Admin User",
            password_hash=hash_password("AdminPass123!"),
            role_id=admin_role.id,
            is_active=True,
        )
        session.add(admin)
        session.commit()
        admin_id = admin.id

    admin_token = create_access_token(subject=str(admin_id), role="ADMIN")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.delete(f"/api/v1/assessments/{ass_id}", headers=admin_headers)
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"
    assert "existing attempts" in res.json()["error"]["message"]

    print("Trainer analytics, permission boundaries, and deletion safeguards verified.")


if __name__ == "__main__":
    setup_module()
    test_part6_competency_update_math()
    test_part6_seed_assessments_and_questions()
    test_part6_assessment_lifecycle_and_security()
    test_part6_quiz_flow_scoring_and_competency_update()
    test_part6_trainer_analytics_and_attempt_deletion_guard()
    print("\n=======================================================")
    print("ALL PART 6 ASSESSMENT & QUIZ ENGINE TESTS PASSED!")
    print("=======================================================")
