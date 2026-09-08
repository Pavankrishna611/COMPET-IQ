"""Integration and Unit Test Suite for Part 9B.2: UserSkillDeclaration Database Model."""

import os
import sys
import uuid

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.init_db import seed_database_data
from app.models import (
    Competency,
    Role,
    User,
    UserCompetency,
    UserProfile,
    UserSkillDeclaration,
)
from app.models.user_skill_declaration import (
    CONFIDENCE_LEVELS,
    DECLARATION_SOURCES,
    VALID_SELF_ASSESSED_LEVELS,
)


def test_user_skill_declaration_model():
    print("\n--- 1. Verify Model Import & Constants ---")
    assert UserSkillDeclaration is not None
    assert VALID_SELF_ASSESSED_LEVELS == [1, 2, 3, 4, 5]
    assert "MEDIUM" in CONFIDENCE_LEVELS
    assert "SELF_DECLARED" in DECLARATION_SOURCES
    print("UserSkillDeclaration imported successfully from app.models with required constants.")

    print("\n--- 2. Initialize In-Memory Test Database & Verify Schema Creation ---")
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database schema created successfully with all tables including user_skill_declarations.")

    with Session() as session:
        seed_database_data(db_session=session)

        learner_role = session.query(Role).filter(Role.name == "LEARNER").first()
        assert learner_role is not None

        # Fetch test competencies
        python_comp = session.query(Competency).filter(Competency.code == "TECH_PY").first()
        sql_comp = session.query(Competency).filter(Competency.code == "TECH_SQL").first()
        assert python_comp is not None and sql_comp is not None

        # Create two test users
        user_1 = User(
            email="skill_user1@example.com",
            official_id="USR-SKILL-01",
            password_hash="hashed_pw_1",
            full_name="Skill Learner One",
            role_id=learner_role.id,
        )
        user_2 = User(
            email="skill_user2@example.com",
            official_id="USR-SKILL-02",
            password_hash="hashed_pw_2",
            full_name="Skill Learner Two",
            role_id=learner_role.id,
        )
        session.add_all([user_1, user_2])
        session.commit()
        session.refresh(user_1)
        session.refresh(user_2)

        print("\n--- 3. Test Creation of UserSkillDeclaration with Defaults ---")
        decl_1 = UserSkillDeclaration(
            user_id=user_1.id,
            competency_id=python_comp.id,
            self_assessed_level=3,
            confidence_level="HIGH",
            years_of_experience=2.5,
            last_used="CURRENTLY_USING",
        )
        session.add(decl_1)
        session.commit()
        session.refresh(decl_1)

        assert decl_1.id is not None
        assert decl_1.user_id == user_1.id
        assert decl_1.competency_id == python_comp.id
        assert decl_1.self_assessed_level == 3
        assert decl_1.confidence_level == "HIGH"
        assert decl_1.years_of_experience == 2.5
        assert decl_1.last_used == "CURRENTLY_USING"
        assert decl_1.source == "SELF_DECLARED"
        assert decl_1.created_at is not None
        assert decl_1.updated_at is not None
        print("Skill declaration created with correct attributes, timestamps, and default source.")

        print("\n--- 4. Test Relationship with User ---")
        session.refresh(user_1)
        assert len(user_1.skill_declarations) == 1
        assert user_1.skill_declarations[0].id == decl_1.id
        assert decl_1.user.id == user_1.id
        assert decl_1.user.email == "skill_user1@example.com"
        print("Bidirectional relationship between User and UserSkillDeclaration verified.")

        print("\n--- 5. Test Relationship with Competency ---")
        session.refresh(python_comp)
        assert any(d.id == decl_1.id for d in python_comp.skill_declarations)
        assert decl_1.competency.id == python_comp.id
        assert decl_1.competency.name == "Python"
        print("Bidirectional relationship between Competency and UserSkillDeclaration verified.")

        print("\n--- 6. Test Multiple Distinct Declarations for One User ---")
        decl_2 = UserSkillDeclaration(
            user_id=user_1.id,
            competency_id=sql_comp.id,
            self_assessed_level=4,
            confidence_level="MEDIUM",
        )
        session.add(decl_2)
        session.commit()
        session.refresh(user_1)
        assert len(user_1.skill_declarations) == 2
        print("One user can declare multiple distinct competencies (Python + SQL).")

        print("\n--- 7. Test Different User Declaring Same Competency ---")
        decl_user2 = UserSkillDeclaration(
            user_id=user_2.id,
            competency_id=python_comp.id,
            self_assessed_level=2,
            confidence_level="LOW",
        )
        session.add(decl_user2)
        session.commit()
        session.refresh(user_2)
        assert len(user_2.skill_declarations) == 1
        print("Different user can declare the same competency without collision.")

        print("\n--- 8. Test Duplicate User + Competency Prevention (UniqueConstraint) ---")
        duplicate_decl = UserSkillDeclaration(
            user_id=user_1.id,
            competency_id=python_comp.id,  # user_1 already declared python_comp
            self_assessed_level=4,
            confidence_level="HIGH",
        )
        session.add(duplicate_decl)
        try:
            session.commit()
            raise AssertionError("Duplicate declaration should have raised IntegrityError!")
        except IntegrityError:
            session.rollback()
            print("UniqueConstraint (user_id + competency_id) successfully prevented duplicate declaration.")

        print("\n--- 9. Test Self-Assessed Level & Confidence Validation ---")
        # Test level out of range (< 1)
        try:
            UserSkillDeclaration(
                user_id=user_1.id,
                competency_id=python_comp.id,
                self_assessed_level=0,
            )
            raise AssertionError("Level 0 should have failed validation!")
        except ValueError as e:
            assert "between 1 and 5" in str(e)
            print("Validation caught level < 1.")

        # Test level out of range (> 5)
        try:
            UserSkillDeclaration(
                user_id=user_1.id,
                competency_id=python_comp.id,
                self_assessed_level=6,
            )
            raise AssertionError("Level 6 should have failed validation!")
        except ValueError as e:
            assert "between 1 and 5" in str(e)
            print("Validation caught level > 5.")

        # Test invalid confidence level
        try:
            UserSkillDeclaration(
                user_id=user_1.id,
                competency_id=python_comp.id,
                confidence_level="EXTREME",
            )
            raise AssertionError("Invalid confidence level should have failed validation!")
        except ValueError as e:
            assert "one of LOW, MEDIUM, HIGH" in str(e)
            print("Validation caught invalid confidence level.")

        print("\n--- 10. Test Clear Separation from UserCompetency ---")
        # UserCompetency count should remain unaffected by UserSkillDeclaration
        user_comps_count = session.query(UserCompetency).filter(UserCompetency.user_id == user_1.id).count()
        assert user_comps_count == 0, "UserSkillDeclaration must NOT create UserCompetency records"
        print("Strict separation between UserSkillDeclaration and UserCompetency confirmed.")

        print("\n--- 11. Test Cascade Delete On User Deletion ---")
        decl_ids = [d.id for d in user_1.skill_declarations]
        session.delete(user_1)
        session.commit()
        remaining_decls = session.query(UserSkillDeclaration).filter(UserSkillDeclaration.id.in_(decl_ids)).all()
        assert len(remaining_decls) == 0, "Cascade delete failed: orphaned declarations found"
        print("Cascade delete on User removal verified.")

    print("\nALL PART 9B.2 DATABASE MODEL TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_user_skill_declaration_model()
