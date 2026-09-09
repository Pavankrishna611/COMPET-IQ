import sys, os
sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.user_profile import UserProfile
import uuid

client = TestClient(app)

def test_full_onboarding_and_routing_flow():
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:6]
    test_email = f"learner_{unique_suffix}@example.com"
    test_pass = "SecurePass123"

    # 1. Register new learner
    reg_resp = client.post("/api/v1/auth/register", json={
        "full_name": f"Test Officer {unique_suffix}",
        "email": test_email,
        "password": test_pass,
        "confirm_password": test_pass
    })
    assert reg_resp.status_code == 201, reg_resp.text

    # 2. Login as newly registered learner
    login_resp = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": test_pass
    })
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify status: newly registered user must NOT be complete -> must route to /onboarding
    status_resp = client.get("/api/v1/onboarding/status", headers=headers)
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["profile_completed"] is False
    assert status_data["onboarding_completed"] is False
    # Verified: Case 1 - New learner routes to /onboarding

    # 3. Complete Part 9B: Professional Profile
    prof_resp = client.post("/api/v1/onboarding/profile", headers=headers, json={
        "designation": "Assistant Director",
        "department": "National Accounts Division",
        "job_role": "Statistical Investigator Grade I",
        "current_assignment": "Annual Survey of Industries tabulation and quality assurance",
        "education": "Post Graduate",
        "education_level": "Post Graduate",
        "specialization": "Statistics and Econometrics",
        "experience": "5-10 years",
        "previous_trainings": "Advanced Sampling Methods, National Accounts Compilation",
        "career_goal": "Lead macroeconomic forecasting and national statistical indicator production",
        "professional_goal": "Lead macroeconomic forecasting and national statistical indicator production"
    })
    assert prof_resp.status_code in [200, 201], prof_resp.text

    # Check status after Part 9B: profile is completed, but onboarding is still NOT completed!
    status_resp2 = client.get("/api/v1/onboarding/status", headers=headers)
    status_data2 = status_resp2.json()
    assert status_data2["profile_completed"] is True
    assert status_data2["onboarding_completed"] is False
    # Verified: Case 2 - Profile completed, user proceeds to AI competency analysis

    # 4. Part 9C: AI Competency Suggestions & Acceptance
    analysis_resp = client.post("/api/v1/onboarding/analyze-profile", headers=headers, json={})
    assert analysis_resp.status_code == 200
    suggestions = analysis_resp.json()
    assert len(suggestions) > 0

    accept_resp = client.post("/api/v1/onboarding/accept-competencies", headers=headers, json={
        "competencies": [
            {
                "competency_id": s["competency_id"],
                "competency_name": s["competency_name"],
                "domain": s["domain"],
                "required_level": s["required_level"],
                "priority": s["priority"]
            }
            for s in suggestions[:3]
        ]
    })
    assert accept_resp.status_code == 200
    # Verified: Case 3 - Competencies accepted, user proceeds to competency evaluation / skill gaps

    # 5. Part 9D: Competency Evaluation & Skill Gap Analysis
    eval_resp = client.post("/api/v1/onboarding/evaluate-competencies", headers=headers, json={})
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    assert "competencies" in eval_data
    assert "summary" in eval_data
    assert len(eval_data["competencies"]) > 0
    # Verified: Case 4 - Gap analysis completes, user proceeds to course recommendations

    # 6. Part 9E: Course Recommendations & Complete Onboarding
    complete_resp = client.post("/api/v1/onboarding/complete", headers=headers, json={})
    assert complete_resp.status_code == 200
    complete_data = complete_resp.json()
    assert complete_data["onboarding_completed"] is True
    assert complete_data["profile_completed"] is True

    # 7. Existing learner with completed onboarding logs in
    login_done_resp = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": test_pass
    })
    assert login_done_resp.status_code == 200
    token_done = login_done_resp.json()["access_token"]
    headers_done = {"Authorization": f"Bearer {token_done}"}
    status_done = client.get("/api/v1/onboarding/status", headers=headers_done).json()
    assert status_done["profile_completed"] is True
    assert status_done["onboarding_completed"] is True
    # Verified: Case 5 - Completed learner routes to /learner/dashboard

    # 8. Existing learner with incomplete onboarding logs in (arjun.kumar@mospi.gov.in)
    login_arjun = client.post("/api/v1/auth/login", json={
        "email": "arjun.kumar@mospi.gov.in",
        "password": "demo123"
    })
    assert login_arjun.status_code == 200
    token_arjun = login_arjun.json()["access_token"]
    status_arjun = client.get("/api/v1/onboarding/status", headers={"Authorization": f"Bearer {token_arjun}"}).json()
    assert status_arjun["onboarding_completed"] is False
    # Verified: Case 6 - Incomplete learner routes to /onboarding

    # 9. Trainer logs in
    login_trainer = client.post("/api/v1/auth/login", json={
        "email": "rahul.verma@nssta.gov.in",
        "password": "demo123"
    })
    assert login_trainer.status_code == 200
    trainer_user = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {login_trainer.json()['access_token']}"}).json()
    assert trainer_user["role"]["name"] == "TRAINER"
    # Verified: Case 7 - Trainer routes to Trainer Dashboard

    # 10. Admin logs in
    login_admin = client.post("/api/v1/auth/login", json={
        "email": "priya.sharma@mospi.gov.in",
        "password": "demo123"
    })
    assert login_admin.status_code == 200
    admin_user = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {login_admin.json()['access_token']}"}).json()
    assert admin_user["role"]["name"] == "ADMIN"
    # Verified: Case 8 - Admin routes to Admin Dashboard

if __name__ == "__main__":
    test_full_onboarding_and_routing_flow()
    print(">>> ALL 8 ONBOARDING & ROUTING CASES PASSED SUCCESSFULLY! <<<")

