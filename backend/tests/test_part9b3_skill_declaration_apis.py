"""Integration and Unit Test Suite for Part 9B.3: User Skill Declaration APIs."""

import os
import sys
import uuid

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.init_db import seed_database_data
from app.database.session import get_db
from app.main import app
from app.models.competency import Competency
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_profile import UserProfile

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


def test_skill_declaration_apis():
    print("\n--- 1. Initialize Test DB and Seed Data ---")
    Base.metadata.create_all(bind=test_engine)
    with TestingSessionLocal() as session:
        seed_database_data(db_session=session)
    print("Database initialized and demo reference data seeded.")

    # Fetch reference competencies (Python, SQL, Survey Design)
    with TestingSessionLocal() as session:
        py_comp = session.query(Competency).filter(Competency.code == "TECH_PY").first()
        sql_comp = session.query(Competency).filter(Competency.code == "TECH_SQL").first()
        survey_comp = session.query(Competency).filter(Competency.code == "STAT_SURVEY").first()
        assert py_comp and sql_comp and survey_comp

        py_id = str(py_comp.id)
        sql_id = str(sql_comp.id)
        survey_id = str(survey_comp.id)

    print("\n--- 2. Register & Login Two Separate Test Users ---")
    # User A
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "User Alpha",
            "email": "user_alpha@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    login_a = client.post(
        "/api/v1/auth/login",
        json={"email": "user_alpha@example.com", "password": "Password123!"},
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "User Beta",
            "email": "user_beta@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    login_b = client.post(
        "/api/v1/auth/login",
        json={"email": "user_beta@example.com", "password": "Password123!"},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Complete User A's profile first so we can verify progression from step 2 to step 3
    prof_res = client.post(
        "/api/v1/onboarding/profile",
        headers=headers_a,
        json={
            "designation": "Junior Data Analyst",
            "employment_type": "GOVERNMENT_OFFICER",
            "experience_years": 1.5,
            "education_level": "BACHELORS",
        },
    )
    assert prof_res.status_code == 201

    # Verify initial onboarding status is Step 2
    status_init = client.get("/api/v1/onboarding/status", headers=headers_a).json()
    assert status_init["current_step"] == 2
    assert status_init["profile_completed"] is True
    assert status_init["skills_completed"] is False
    print("User Alpha initialized at Step 2 with completed profile and uncompleted skills.")

    print("\n--- 3. Test Unauthorized Requests Rejected (Test 9) ---")
    assert client.post("/api/v1/onboarding/skills", json={"skills": []}).status_code == 401
    assert client.get("/api/v1/onboarding/skills/me").status_code == 401
    assert client.put(f"/api/v1/onboarding/skills/{py_id}", json={"self_assessed_level": 3}).status_code == 401
    assert client.delete(f"/api/v1/onboarding/skills/{py_id}").status_code == 401
    print("All endpoints rejected unauthorized calls with HTTP 401.")

    print("\n--- 4. Test Invalid Proficiency Levels (Tests 7 & 8) ---")
    # Level below 1 (< 1)
    res_below = client.post(
        "/api/v1/onboarding/skills",
        headers=headers_a,
        json={
            "skills": [
                {"competency_id": py_id, "self_assessed_level": 0, "confidence_level": "MEDIUM"}
            ]
        },
    )
    assert res_below.status_code == 422, f"Expected 422 for level < 1, got {res_below.status_code}"

    # Level above 5 (> 5)
    res_above = client.post(
        "/api/v1/onboarding/skills",
        headers=headers_a,
        json={
            "skills": [
                {"competency_id": py_id, "self_assessed_level": 6, "confidence_level": "MEDIUM"}
            ]
        },
    )
    assert res_above.status_code == 422, f"Expected 422 for level > 5, got {res_above.status_code}"
    print("Invalid proficiency levels (0 and 6) properly rejected with HTTP 422.")

    print("\n--- 5. Test Invalid Competency ID (Test 5) ---")
    fake_comp_id = str(uuid.uuid4())
    res_invalid_comp = client.post(
        "/api/v1/onboarding/skills",
        headers=headers_a,
        json={
            "skills": [
                {"competency_id": fake_comp_id, "self_assessed_level": 3, "confidence_level": "MEDIUM"}
            ]
        },
    )
    assert res_invalid_comp.status_code == 404, f"Expected 404, got {res_invalid_comp.status_code}"
    print("Non-existent competency ID properly rejected with HTTP 404.")

    print("\n--- 6. Test Duplicate Competency in Bulk Request (Test 6) ---")
    res_dup = client.post(
        "/api/v1/onboarding/skills",
        headers=headers_a,
        json={
            "skills": [
                {"competency_id": py_id, "self_assessed_level": 2, "confidence_level": "LOW"},
                {"competency_id": py_id, "self_assessed_level": 3, "confidence_level": "HIGH"},
            ]
        },
    )
    assert res_dup.status_code == 400, f"Expected 400 for duplicate competencies, got {res_dup.status_code}"
    print("Duplicate competency ID in bulk request rejected with HTTP 400.")

    print("\n--- 7. Test Submit Multiple Valid Skills (Test 1) ---")
    bulk_payload = {
        "skills": [
            {
                "competency_id": py_id,
                "self_assessed_level": 2,
                "confidence_level": "LOW",
                "years_of_experience": 1.0,
                "last_used": "1_YEAR_AGO",
            },
            {
                "competency_id": sql_id,
                "self_assessed_level": 3,
                "confidence_level": "MEDIUM",
                "years_of_experience": 2.0,
                "last_used": "CURRENTLY_USING",
            },
        ]
    }
    submit_res = client.post("/api/v1/onboarding/skills", headers=headers_a, json=bulk_payload)
    assert submit_res.status_code == 200, f"Bulk submit failed: {submit_res.text}"
    declared = submit_res.json()
    assert len(declared) == 2

    # Verify fields in response
    for item in declared:
        assert "id" in item
        assert "competency_id" in item
        assert "competency_name" in item
        assert "competency_domain" in item
        assert item["source"] == "SELF_DECLARED"
        assert item["self_assessed_level"] in (2, 3)

    # Verify UserProfile was updated to Step 3 and skills_completed = True
    status_after = client.get("/api/v1/onboarding/status", headers=headers_a).json()
    assert status_after["skills_completed"] is True
    assert status_after["current_step"] == 3
    assert status_after["next_action"] == "Initialize your competency profile"
    print("Multiple skills declared. UserProfile.skills_completed = True, onboarding_step = 3 verified.")

    print("\n--- 8. Test Retrieve Current User's Skills (Test 2) ---")
    my_skills_res = client.get("/api/v1/onboarding/skills/me", headers=headers_a)
    assert my_skills_res.status_code == 200
    my_skills = my_skills_res.json()
    assert len(my_skills) == 2
    comp_names = [s["competency_name"] for s in my_skills]
    assert "Python" in comp_names and "SQL" in comp_names

    # User B should have 0 declared skills
    user_b_skills = client.get("/api/v1/onboarding/skills/me", headers=headers_b).json()
    assert user_b_skills == [], "User B should not see User A's declared skills"
    print("GET /skills/me returned caller's skills and isolated User B.")

    print("\n--- 9. Test Update Python Declaration (Test 3) ---")
    update_res = client.put(
        f"/api/v1/onboarding/skills/{py_id}",
        headers=headers_a,
        json={
            "self_assessed_level": 4,
            "confidence_level": "HIGH",
            "years_of_experience": 3.5,
            "last_used": "CURRENTLY_USING",
        },
    )
    assert update_res.status_code == 200, f"Update failed: {update_res.text}"
    updated_data = update_res.json()
    assert updated_data["competency_id"] == py_id
    assert updated_data["self_assessed_level"] == 4
    assert updated_data["confidence_level"] == "HIGH"
    assert updated_data["years_of_experience"] == 3.5
    assert updated_data["last_used"] == "CURRENTLY_USING"
    print("PUT /skills/{competency_id} successfully updated Python declaration.")

    print("\n--- 10. Test Another User Cannot Modify or Delete User A's Declaration (Test 10) ---")
    # User B attempts to update User A's Python declaration
    unauth_update = client.put(
        f"/api/v1/onboarding/skills/{py_id}",
        headers=headers_b,
        json={"self_assessed_level": 5},
    )
    assert unauth_update.status_code == 404, f"User B should get 404, got {unauth_update.status_code}"

    # User B attempts to delete User A's Python declaration
    unauth_del = client.delete(f"/api/v1/onboarding/skills/{py_id}", headers=headers_b)
    assert unauth_del.status_code == 404, f"User B should get 404, got {unauth_del.status_code}"
    print("Cross-user modification and deletion strictly prevented with HTTP 404.")

    print("\n--- 11. Test Delete SQL Declaration (Test 4) ---")
    del_sql_res = client.delete(f"/api/v1/onboarding/skills/{sql_id}", headers=headers_a)
    assert del_sql_res.status_code == 200
    assert "deleted successfully" in del_sql_res.json()["message"]

    # Check remaining skills: should only have Python
    my_skills_after_del = client.get("/api/v1/onboarding/skills/me", headers=headers_a).json()
    assert len(my_skills_after_del) == 1
    assert my_skills_after_del[0]["competency_id"] == py_id

    # User still has Python declared, so skills_completed remains True
    status_still_has_skills = client.get("/api/v1/onboarding/status", headers=headers_a).json()
    assert status_still_has_skills["skills_completed"] is True
    print("SQL declaration deleted successfully. 1 skill remaining, skills_completed remains True.")

    print("\n--- 12. Test Deleting Last Remaining Skill Updates Onboarding Status ---")
    del_py_res = client.delete(f"/api/v1/onboarding/skills/{py_id}", headers=headers_a)
    assert del_py_res.status_code == 200

    # User now has 0 declared skills
    empty_skills = client.get("/api/v1/onboarding/skills/me", headers=headers_a).json()
    assert empty_skills == []

    # Onboarding status should revert skills_completed to False, and step to 2 (profile is completed)
    status_empty = client.get("/api/v1/onboarding/status", headers=headers_a).json()
    assert status_empty["skills_completed"] is False
    assert status_empty["current_step"] == 2
    assert status_empty["next_action"] == "Declare your current skills"
    print("Deleting last skill reverted skills_completed to False and step to 2.")

    print("\n--- 13. Verify Zero Modifications to UserCompetency Table ---")
    with TestingSessionLocal() as session:
        user_a = session.query(User).filter(User.email == "user_alpha@example.com").first()
        uc_count = session.query(UserCompetency).filter(UserCompetency.user_id == user_a.id).count()
        assert uc_count == 0, f"UserCompetency table for User Alpha should be 0, found {uc_count} records"
    print("UserCompetency verified completely untouched by UserSkillDeclaration APIs.")

    print("\nALL PART 9B.3 SKILL DECLARATION API TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_skill_declaration_apis()
