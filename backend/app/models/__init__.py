"""COMPETIQ Database Models Package."""

from app.models.base import BaseModel, TimestampMixin
from app.models.assessment import Assessment
from app.models.assessment_attempt import AssessmentAttempt
from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage
from app.models.competency import Competency
from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.course_prerequisite import CoursePrerequisite
from app.models.department import Department
from app.models.document_chunk import DocumentChunk
from app.models.generated_question import GeneratedQuestion
from app.models.learning_material import LearningMaterial
from app.models.learning_path import LearningPath
from app.models.learning_path_item import LearningPathItem
from app.models.question import Question
from app.models.question_attempt import QuestionAttempt
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration

__all__ = [
    "BaseModel",
    "TimestampMixin",
    "Role",
    "Department",
    "User",
    "UserProfile",
    "UserSkillDeclaration",
    "Competency",
    "UserCompetency",
    "RoleCompetencyRequirement",
    "Course",
    "CourseCompetency",
    "CoursePrerequisite",
    "LearningPath",
    "LearningPathItem",
    "Assessment",
    "Question",
    "AssessmentAttempt",
    "QuestionAttempt",
    "LearningMaterial",
    "GeneratedQuestion",
    "DocumentChunk",
    "ChatConversation",
    "ChatMessage",
]
