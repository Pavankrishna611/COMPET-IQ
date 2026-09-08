"""Database initialization, schema creation, and core reference seed data."""

import logging
from contextlib import nullcontext
from typing import Dict, List, Optional

from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session

# Import Base, engine, and SessionLocal
from app.database.base import Base
from app.database.session import SessionLocal, engine

# Import all models to ensure metadata registration
import app.models  # noqa: F401
from app.core.security import hash_password
from app.models.assessment import Assessment
from app.models.competency import Competency
from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.course_prerequisite import CoursePrerequisite
from app.models.department import Department
from app.models.question import Question
from app.models.role import Role
from app.models.role_competency import RoleCompetencyRequirement
from app.models.user import User
from app.models.user_competency import UserCompetency
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration

logger = logging.getLogger("competiq.database")

# -----------------------------------------------------------------------------
# Seed Data Definitions
# -----------------------------------------------------------------------------
DEFAULT_ROLES = [
    # System RBAC Personas
    {
        "name": "LEARNER",
        "description": "Standard learner persona. Can view competencies, learning paths, and take assessments.",
    },
    {
        "name": "TRAINER",
        "description": "Trainer persona. Can manage assessments and learning materials.",
    },
    {
        "name": "ADMIN",
        "description": "Administrator persona. Can access workforce analytics and administration features.",
    },
    # Job Roles / Designations (Representing organizational posts with benchmark competency profiles)
    {
        "name": "Statistical Investigator",
        "description": "Job role responsible for conducting field surveys, data verification, and preliminary statistical analysis.",
    },
    {
        "name": "Data Analyst",
        "description": "Job role responsible for analyzing administrative and statistical datasets to generate insights.",
    },
    {
        "name": "Statistical Officer",
        "description": "Job role overseeing statistical compilations, survey methodologies, and validation.",
    },
    {
        "name": "Senior Statistical Officer",
        "description": "Job role leading national statistical indicators, policy modeling, and data governance.",
    },
]

CORE_COMPETENCIES = [
    # TECHNICAL
    {"name": "Python", "code": "TECH_PY", "domain": "Technical", "category": "Programming", "description": "Statistical programming, data wrangling, and analytics with Python."},
    {"name": "SQL", "code": "TECH_SQL", "domain": "Technical", "category": "Databases", "description": "Relational database querying, aggregation, data cleaning, and joins."},
    {"name": "R", "code": "TECH_R", "domain": "Technical", "category": "Programming", "description": "Statistical computing, econometric modeling, and graphics in R."},
    {"name": "GIS", "code": "TECH_GIS", "domain": "Technical", "category": "Spatial Analysis", "description": "Geographic Information Systems, spatial mapping, and geospatial analysis."},
    {"name": "Data Visualization", "code": "TECH_VIZ", "domain": "Technical", "category": "Analytics", "description": "Designing intuitive charts, dashboards, and visual data representations."},
    {"name": "AI / Machine Learning", "code": "TECH_AIML", "domain": "Technical", "category": "Artificial Intelligence", "description": "Predictive modeling, classification, and machine learning techniques."},
    {"name": "Cloud Computing", "code": "TECH_CLOUD", "domain": "Technical", "category": "Infrastructure", "description": "Cloud services, distributed computing, and data storage workflows."},

    # STATISTICAL
    {"name": "Survey Design", "code": "STAT_SURVEY", "domain": "Statistical Methods", "category": "Methodology", "description": "Questionnaire design, pilot testing, and survey planning."},
    {"name": "Sampling", "code": "STAT_SAMPLING", "domain": "Statistical Methods", "category": "Sampling", "description": "Probability sampling, stratification, cluster sampling, and weighting."},
    {"name": "National Accounts", "code": "STAT_NAT_ACC", "domain": "Statistical Methods", "category": "Economics", "description": "Macroeconomic aggregates, GDP compilation, and System of National Accounts."},
    {"name": "Price Statistics", "code": "STAT_PRICE", "domain": "Statistical Methods", "category": "Economics", "description": "Consumer, Producer, and Wholesale Price Index compilation."},
    {"name": "Labour Statistics", "code": "STAT_LABOUR", "domain": "Statistical Methods", "category": "Labour", "description": "Employment metrics, labour force surveys, and wage indicators."},
    {"name": "Data Quality", "code": "STAT_QUALITY", "domain": "Statistical Methods", "category": "Quality Assurance", "description": "Data validation, error detection, imputation, and quality frameworks."},

    # DIGITAL GOVERNANCE
    {"name": "Cybersecurity", "code": "GOV_CYBER", "domain": "Digital Governance", "category": "Security", "description": "Information security protocols, safe computing, and threat mitigation."},
    {"name": "Data Privacy", "code": "GOV_PRIVACY", "domain": "Digital Governance", "category": "Compliance", "description": "Data confidentiality, anonymization, and statutory privacy compliance."},
    {"name": "Digital Signatures", "code": "GOV_DIGI_SIG", "domain": "Digital Governance", "category": "Authentication", "description": "PKI, digital signing workflows, and electronic document verification."},
    {"name": "Government Cloud", "code": "GOV_CLOUD", "domain": "Digital Governance", "category": "Infrastructure", "description": "National cloud platforms, compliance standards, and sovereign data management."},

    # BEHAVIOURAL
    {"name": "Leadership", "code": "BEH_LEAD", "domain": "Behavioural", "category": "Soft Skills", "description": "Team guidance, motivation, and strategic execution."},
    {"name": "Communication", "code": "BEH_COMM", "domain": "Behavioural", "category": "Soft Skills", "description": "Effective verbal, written, and visual presentation of statistical findings."},
    {"name": "Project Management", "code": "BEH_PM", "domain": "Behavioural", "category": "Management", "description": "Planning, resource allocation, and milestone monitoring for statistical projects."},
    {"name": "Ethics", "code": "BEH_ETHICS", "domain": "Behavioural", "category": "Governance", "description": "Professional integrity, objectivity, and statistical codes of practice."},
    {"name": "Decision Making", "code": "BEH_DECISION", "domain": "Behavioural", "category": "Management", "description": "Evidence-based problem solving and strategic operational choices."},
]

SAMPLE_ROLE_REQUIREMENTS = {
    # Statistical Investigator Benchmark Profile
    "Statistical Investigator": [
        {"code": "TECH_PY", "required_level": 4.0, "priority": "HIGH"},
        {"code": "TECH_SQL", "required_level": 3.5, "priority": "HIGH"},
        {"code": "TECH_VIZ", "required_level": 4.0, "priority": "CRITICAL"},
        {"code": "STAT_SAMPLING", "required_level": 4.0, "priority": "HIGH"},
        {"code": "STAT_QUALITY", "required_level": 4.0, "priority": "CRITICAL"},
        {"code": "TECH_GIS", "required_level": 3.5, "priority": "MEDIUM"},
    ],
    # Mirror onto LEARNER role so generic platform learners immediately have active benchmark requirements
    "LEARNER": [
        {"code": "TECH_PY", "required_level": 4.0, "priority": "HIGH"},
        {"code": "TECH_SQL", "required_level": 3.5, "priority": "HIGH"},
        {"code": "TECH_VIZ", "required_level": 4.0, "priority": "CRITICAL"},
        {"code": "STAT_SAMPLING", "required_level": 4.0, "priority": "HIGH"},
        {"code": "STAT_QUALITY", "required_level": 4.0, "priority": "CRITICAL"},
        {"code": "TECH_GIS", "required_level": 3.5, "priority": "MEDIUM"},
    ],
}

DEMO_COURSES = [
    {
        "title": "Python Fundamentals",
        "provider": "COMPETIQ Learning",
        "domain": "Technical",
        "difficulty": "Beginner",
        "duration_hours": 12.0,
        "description": "Core syntax, data structures, and foundational programming in Python.",
        "competencies": [{"code": "TECH_PY", "improvement": 1.5}],
        "prerequisites": [],
    },
    {
        "title": "Python for Statistical Analysis",
        "provider": "iGOT Karmayogi",
        "domain": "Technical",
        "difficulty": "Intermediate",
        "duration_hours": 18.0,
        "description": "Pandas, NumPy, and statistical calculations applied to survey data.",
        "competencies": [{"code": "TECH_PY", "improvement": 2.0}],
        "prerequisites": ["Python Fundamentals"],
    },
    {
        "title": "SQL for Data Analysis",
        "provider": "iGOT Karmayogi",
        "domain": "Technical",
        "difficulty": "Intermediate",
        "duration_hours": 15.0,
        "description": "Complex joins, window functions, and data transformations for analytics.",
        "competencies": [{"code": "TECH_SQL", "improvement": 1.8}],
        "prerequisites": [],
    },
    {
        "title": "Data Visualization for Statistics",
        "provider": "NSSTA / TPAC",
        "domain": "Technical",
        "difficulty": "Intermediate",
        "duration_hours": 12.0,
        "description": "Principles of statistical data presentation, charts, and dashboards.",
        "competencies": [{"code": "TECH_VIZ", "improvement": 1.8}],
        "prerequisites": [],
    },
    {
        "title": "GIS for Statistical Applications",
        "provider": "NSSTA / TPAC",
        "domain": "Technical",
        "difficulty": "Intermediate",
        "duration_hours": 20.0,
        "description": "Geographic analysis, thematic maps, and spatial boundary overlays for surveys.",
        "competencies": [{"code": "TECH_GIS", "improvement": 1.5}],
        "prerequisites": [],
    },
    {
        "title": "Fundamentals of Survey Sampling",
        "provider": "COMPETIQ Learning",
        "domain": "Statistical Methods",
        "difficulty": "Beginner",
        "duration_hours": 10.0,
        "description": "Probability sampling, stratification, and sample size calculations.",
        "competencies": [
            {"code": "STAT_SAMPLING", "improvement": 1.5},
            {"code": "STAT_SURVEY", "improvement": 1.2},
        ],
        "prerequisites": [],
    },
    {
        "title": "Advanced Sampling Techniques",
        "provider": "NSSTA / TPAC",
        "domain": "Statistical Methods",
        "difficulty": "Advanced",
        "duration_hours": 16.0,
        "description": "Multistage sampling, variance estimation, and non-response adjustment.",
        "competencies": [{"code": "STAT_SAMPLING", "improvement": 2.0}],
        "prerequisites": ["Fundamentals of Survey Sampling"],
    },
    {
        "title": "Data Quality Management",
        "provider": "iGOT Karmayogi",
        "domain": "Statistical Methods",
        "difficulty": "Intermediate",
        "duration_hours": 8.0,
        "description": "Data profiling, cleansing, automated verification, and audit rules.",
        "competencies": [{"code": "STAT_QUALITY", "improvement": 1.5}],
        "prerequisites": [],
    },
    {
        "title": "Introduction to AI for Official Statistics",
        "provider": "COMPETIQ Learning",
        "domain": "Technical",
        "difficulty": "Beginner",
        "duration_hours": 10.0,
        "description": "Applications of machine learning in official statistical compilation and coding.",
        "competencies": [{"code": "TECH_AIML", "improvement": 1.5}],
        "prerequisites": [],
    },
]

DEMO_ASSESSMENTS = [
    {
        "title": "Python Fundamentals Assessment",
        "description": "Evaluate foundational Python knowledge for data analysis.",
        "instructions": "Answer all 10 multiple-choice questions covering Python syntax, data types, control flow, functions, and data structures.",
        "duration_minutes": 25,
        "difficulty": "BEGINNER",
        "status": "PUBLISHED",
        "questions": [
            {
                "competency_code": "TECH_PY",
                "question_text": "What is the primary characteristic of a Python tuple compared to a Python list?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "Tuples can store only numeric values",
                "option_b": "Tuples are immutable and cannot be modified after creation",
                "option_c": "Tuples are ordered dictionaries with key-value pairs",
                "option_d": "Tuples do not support zero-indexed access",
                "correct_option": "B",
                "explanation": "In Python, tuples are immutable sequences, meaning once created, their elements cannot be changed, added, or removed.",
                "points": 1.0,
                "sequence_order": 1,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "Which Python keyword is used to handle exceptions and execute error-recovery code?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "catch",
                "option_b": "except",
                "option_c": "rescue",
                "option_d": "trap",
                "correct_option": "B",
                "explanation": "Python uses try and except blocks for structured exception handling.",
                "points": 1.0,
                "sequence_order": 2,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "What does the list comprehension expression [x**2 for x in range(5) if x % 2 == 0] evaluate to?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "[0, 4, 16]",
                "option_b": "[1, 9]",
                "option_c": "[0, 1, 4, 9, 16]",
                "option_d": "[4, 16]",
                "correct_option": "A",
                "explanation": "range(5) produces 0, 1, 2, 3, 4. Even numbers are 0, 2, 4, whose squares are 0, 4, 16.",
                "points": 1.0,
                "sequence_order": 3,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "What does the call type({'a': 1, 'b': 2}) return in Python?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "<class 'set'>",
                "option_b": "<class 'dict'>",
                "option_c": "<class 'list'>",
                "option_d": "<class 'tuple'>",
                "correct_option": "B",
                "explanation": "Key-value mappings enclosed in curly brackets define a dictionary (dict).",
                "points": 1.0,
                "sequence_order": 4,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "Which built-in function returns both index and item while iterating over a collection?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "index()",
                "option_b": "enumerate()",
                "option_c": "zip()",
                "option_d": "range_items()",
                "correct_option": "B",
                "explanation": "enumerate(iterable) yields tuples containing the current iteration index and the corresponding element.",
                "points": 1.0,
                "sequence_order": 5,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "How do you access the final element of a non-empty list 'data' in Python using negative indexing?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "data[last]",
                "option_b": "data[-1]",
                "option_c": "data[len(data)]",
                "option_d": "data.last()",
                "correct_option": "B",
                "explanation": "Negative index -1 accesses the final element of a sequence in Python.",
                "points": 1.0,
                "sequence_order": 6,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "What is the truthiness evaluation of bool([]) in standard Python?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "True",
                "option_b": "False",
                "option_c": "None",
                "option_d": "TypeError",
                "correct_option": "B",
                "explanation": "Empty collections (lists, tuples, dicts, sets, and strings) evaluate to False in boolean contexts.",
                "points": 1.0,
                "sequence_order": 7,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "Which operator unpacks elements of a sequence into positional arguments when invoking a function?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "&",
                "option_b": "*",
                "option_c": "**",
                "option_d": "%",
                "correct_option": "B",
                "explanation": "The asterisk * unpacks iterables into positional arguments, while ** unpacks dictionaries into keyword arguments.",
                "points": 1.0,
                "sequence_order": 8,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "Which dictionary method safely retrieves a value for a key, returning a default fallback if the key does not exist?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "dict.search()",
                "option_b": "dict.get()",
                "option_c": "dict.fetch()",
                "option_d": "dict.lookup()",
                "correct_option": "B",
                "explanation": "dict.get(key, default) avoids KeyError exceptions by returning the default value if the key is not present.",
                "points": 1.0,
                "sequence_order": 9,
            },
            {
                "competency_code": "TECH_PY",
                "question_text": "What type of object does range(1, 1000000) return in Python 3?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "A fully allocated list in memory",
                "option_b": "An immutable range sequence object that computes elements on demand",
                "option_c": "A generator function",
                "option_d": "A tuple",
                "correct_option": "B",
                "explanation": "Python 3's range() returns an immutable sequence object of type range, consuming negligible O(1) memory.",
                "points": 1.0,
                "sequence_order": 10,
            },
        ],
    },
    {
        "title": "Sampling Techniques Assessment",
        "description": "Assess competency in statistical sampling methods, survey design, and probability sampling.",
        "instructions": "Answer 8 multiple-choice questions testing your understanding of sampling frames, stratification, and sample size determination.",
        "duration_minutes": 20,
        "difficulty": "INTERMEDIATE",
        "status": "PUBLISHED",
        "questions": [
            {
                "competency_code": "STAT_SAMPLING",
                "question_text": "In probability sampling theory, what is a mandatory condition for every unit in the population?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "Each unit must have an equal selection probability",
                "option_b": "Each unit must have a known and non-zero probability of selection",
                "option_c": "Units must be selected purely through volunteer convenience",
                "option_d": "The sample size must exceed 50% of the total population",
                "correct_option": "B",
                "explanation": "Probability sampling requires that every target population element has a known, non-zero probability of being sampled.",
                "points": 1.0,
                "sequence_order": 1,
            },
            {
                "competency_code": "STAT_SAMPLING",
                "question_text": "When should Stratified Random Sampling be selected over Simple Random Sampling?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "When the population is completely homogeneous with zero variance",
                "option_b": "When the population contains distinct subgroups with differing characteristics and lower within-stratum variance",
                "option_c": "When no sampling frame of the population exists",
                "option_d": "When cost minimization is the only objective regardless of precision",
                "correct_option": "B",
                "explanation": "Stratification groups similar units together, reducing sample variance and ensuring representation of minority sub-populations.",
                "points": 1.0,
                "sequence_order": 2,
            },
            {
                "competency_code": "STAT_SAMPLING",
                "question_text": "What distinguishes Cluster Sampling from Stratified Random Sampling?",
                "question_type": "MCQ",
                "difficulty": "HARD",
                "option_a": "Clusters are sampled as primary units, whereas strata are all sampled internally",
                "option_b": "Clusters must always contain identical sample sizes",
                "option_c": "Cluster sampling always produces lower sampling variance than stratified sampling",
                "option_d": "Cluster sampling cannot be used in geographical survey designs",
                "correct_option": "A",
                "explanation": "In cluster sampling, a sample of whole clusters is selected; in stratified sampling, samples are drawn from every single stratum.",
                "points": 1.0,
                "sequence_order": 3,
            },
            {
                "competency_code": "STAT_SURVEY",
                "question_text": "What constitutes a 'sampling frame' in survey methodology?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "The physical boundary of the survey headquarters",
                "option_b": "The operational list or registry of population units from which sample draws are executed",
                "option_c": "The statistical software used for data entry",
                "option_d": "The schedule of interview dates",
                "correct_option": "B",
                "explanation": "A sampling frame is an exhaustive listing or map from which sampling units are identified and selected.",
                "points": 1.0,
                "sequence_order": 4,
            },
            {
                "competency_code": "STAT_SAMPLING",
                "question_text": "What mathematical relationship describes how sample size n impacts the standard error of the sample mean?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "Standard error increases linearly with n",
                "option_b": "Standard error decreases inversely with the square root of n (1 / sqrt(n))",
                "option_c": "Standard error is independent of sample size",
                "option_d": "Standard error decreases exponentially with n^2",
                "correct_option": "B",
                "explanation": "Standard error of the mean equals sigma / sqrt(n); quadrupling n halves the standard error.",
                "points": 1.0,
                "sequence_order": 5,
            },
            {
                "competency_code": "STAT_SAMPLING",
                "question_text": "Why are design weights (sampling weights) applied during survey estimation?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "To correct for questionnaire typographical errors",
                "option_b": "To compensate for unequal selection probabilities and yield unbiased population estimates",
                "option_c": "To reduce computer memory usage during regression modeling",
                "option_d": "To penalize survey respondents who did not answer demographic questions",
                "correct_option": "B",
                "explanation": "Design weights (inverse probability of selection) ensure that each sampled unit represents the appropriate number of population members.",
                "points": 1.0,
                "sequence_order": 6,
            },
            {
                "competency_code": "STAT_SURVEY",
                "question_text": "Which category of survey error cannot be mitigated purely by expanding the sample size?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "Random sampling error",
                "option_b": "Systematic non-sampling error (e.g., measurement bias or selective non-response)",
                "option_c": "Standard error of the estimate",
                "option_d": "Sampling variance",
                "correct_option": "B",
                "explanation": "Non-sampling errors stem from flawed instruments, interviewer bias, or non-response, which persist regardless of sample scale.",
                "points": 1.0,
                "sequence_order": 7,
            },
            {
                "competency_code": "STAT_SURVEY",
                "question_text": "What is the primary objective of running a survey pilot test prior to national rollout?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "To release preliminary official inflation statistics",
                "option_b": "To validate questionnaire wording, interview duration, and logistical workflows in realistic field conditions",
                "option_c": "To replace the need for an official census sampling frame",
                "option_d": "To bypass government survey ethical approvals",
                "correct_option": "B",
                "explanation": "Pilot testing reveals question ambiguity, respondent cognitive fatigue, and administrative bottlenecks before full survey launch.",
                "points": 1.0,
                "sequence_order": 8,
            },
        ],
    },
    {
        "title": "Data Quality Fundamentals",
        "description": "Assessment of fundamental data quality assurance, validation rules, and error handling in statistics.",
        "instructions": "Answer 5 multiple-choice questions on data cleaning, outlier detection, and validation frameworks.",
        "duration_minutes": 15,
        "difficulty": "BEGINNER",
        "status": "PUBLISHED",
        "questions": [
            {
                "competency_code": "STAT_QUALITY",
                "question_text": "Which data quality dimension evaluates whether data values comply with defined format syntax, permitted ranges, and schemas?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "Timeliness",
                "option_b": "Validity",
                "option_c": "Accessibility",
                "option_d": "Punctuality",
                "correct_option": "B",
                "explanation": "Validity measures whether recorded data conforms strictly to defined business rules, valid code lists, and format constraints.",
                "points": 1.0,
                "sequence_order": 1,
            },
            {
                "competency_code": "STAT_QUALITY",
                "question_text": "Which statistical heuristic is standard for flagging univariate numerical outliers based on quartiles?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "Calculating the total count of null strings",
                "option_b": "The IQR rule: points outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]",
                "option_c": "Alphabetical sorting of character identifiers",
                "option_d": "Summing all values in the column",
                "correct_option": "B",
                "explanation": "Tukey's IQR method defines outlier thresholds at 1.5 times the interquartile range below Q1 and above Q3.",
                "points": 1.0,
                "sequence_order": 2,
            },
            {
                "competency_code": "STAT_QUALITY",
                "question_text": "In official statistical quality frameworks, what does Data Completeness represent?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "The speed at which survey reports are published online",
                "option_b": "The percentage of mandatory fields and required observations that are present and non-null",
                "option_c": "The compression ratio of survey archive files",
                "option_d": "Converting all numeric records to text strings",
                "correct_option": "B",
                "explanation": "Completeness measures the degree to which expected values are present without missing records or omitted variables.",
                "points": 1.0,
                "sequence_order": 3,
            },
            {
                "competency_code": "STAT_QUALITY",
                "question_text": "When imputing missing values in a heavily skewed income dataset, why is median imputation favored over mean imputation?",
                "question_type": "MCQ",
                "difficulty": "MEDIUM",
                "option_a": "The median requires decimal points while the mean does not",
                "option_b": "The median is robust against extreme outliers and does not distort central tendency in asymmetric distributions",
                "option_c": "The median sets all missing values to zero automatically",
                "option_d": "The mean cannot be calculated for datasets with more than 100 rows",
                "correct_option": "B",
                "explanation": "Extreme outliers heavily pull the arithmetic mean, whereas the median remains resistant to distribution skew.",
                "points": 1.0,
                "sequence_order": 4,
            },
            {
                "competency_code": "STAT_QUALITY",
                "question_text": "What type of data quality validation check is represented by: 'Interview_Date >= Date_of_Birth'?",
                "question_type": "MCQ",
                "difficulty": "EASY",
                "option_a": "Format check",
                "option_b": "Cross-field logical consistency check",
                "option_c": "Uniqueness constraint",
                "option_d": "Referential key check",
                "correct_option": "B",
                "explanation": "Cross-field consistency checks verify that relational logic between multiple fields holds true.",
                "points": 1.0,
                "sequence_order": 5,
            },
        ],
    },
]


def seed_database_data(db_session: Optional[Session] = None) -> None:
    """Seed initial system roles, competencies, role benchmark requirements, demo courses, and assessments."""
    try:
        cm = nullcontext(db_session) if db_session is not None else SessionLocal()
        with cm as session:
            # 1. Seed Roles
            roles_by_name: Dict[str, Role] = {}
            for role_info in DEFAULT_ROLES:
                role = session.query(Role).filter(Role.name == role_info["name"]).first()
                if not role:
                    role = Role(
                        name=role_info["name"],
                        description=role_info["description"],
                    )
                    session.add(role)
                    session.flush()
                    logger.info(f"Seeded role: {role_info['name']}")
                roles_by_name[role.name] = role

            # 2. Seed Competencies
            comps_by_code: Dict[str, Competency] = {}
            for comp_info in CORE_COMPETENCIES:
                comp = session.query(Competency).filter(Competency.code == comp_info["code"]).first()
                if not comp:
                    comp = Competency(
                        name=comp_info["name"],
                        code=comp_info["code"],
                        domain=comp_info["domain"],
                        category=comp_info["category"],
                        description=comp_info["description"],
                    )
                    session.add(comp)
                    session.flush()
                    logger.info(f"Seeded competency: {comp_info['name']} ({comp_info['code']})")
                comps_by_code[comp.code] = comp

            # 3. Seed Role Competency Requirements
            for role_name, req_list in SAMPLE_ROLE_REQUIREMENTS.items():
                target_role = roles_by_name.get(role_name)
                if not target_role:
                    continue

                for req_item in req_list:
                    target_comp = comps_by_code.get(req_item["code"])
                    if not target_comp:
                        continue

                    existing_req = (
                        session.query(RoleCompetencyRequirement)
                        .filter(
                            RoleCompetencyRequirement.role_id == target_role.id,
                            RoleCompetencyRequirement.competency_id == target_comp.id,
                        )
                        .first()
                    )
                    if not existing_req:
                        new_req = RoleCompetencyRequirement(
                            role_id=target_role.id,
                            competency_id=target_comp.id,
                            required_level=req_item["required_level"],
                            priority=req_item["priority"],
                        )
                        session.add(new_req)

            # 4. Seed Demo Courses
            courses_by_title: Dict[str, Course] = {}
            for c_data in DEMO_COURSES:
                course = session.query(Course).filter(Course.title == c_data["title"]).first()
                if not course:
                    course = Course(
                        title=c_data["title"],
                        provider=c_data["provider"],
                        domain=c_data["domain"],
                        difficulty=c_data["difficulty"],
                        duration_hours=c_data["duration_hours"],
                        description=c_data["description"],
                        is_active=True,
                    )
                    session.add(course)
                    session.flush()
                    logger.info(f"Seeded demo course: {c_data['title']}")
                courses_by_title[course.title] = course

            # 5. Seed Course Competencies & Prerequisites
            for c_data in DEMO_COURSES:
                course = courses_by_title.get(c_data["title"])
                if not course:
                    continue

                # Add competencies
                for c_comp in c_data.get("competencies", []):
                    comp_obj = comps_by_code.get(c_comp["code"])
                    if comp_obj:
                        existing_cc = (
                            session.query(CourseCompetency)
                            .filter(
                                CourseCompetency.course_id == course.id,
                                CourseCompetency.competency_id == comp_obj.id,
                            )
                            .first()
                        )
                        if not existing_cc:
                            session.add(
                                CourseCompetency(
                                    course_id=course.id,
                                    competency_id=comp_obj.id,
                                    expected_improvement=c_comp["improvement"],
                                )
                            )

                # Add prerequisites
                for prereq_title in c_data.get("prerequisites", []):
                    prereq_course = courses_by_title.get(prereq_title)
                    if prereq_course:
                        existing_cp = (
                            session.query(CoursePrerequisite)
                            .filter(
                                CoursePrerequisite.course_id == course.id,
                                CoursePrerequisite.prerequisite_course_id == prereq_course.id,
                            )
                            .first()
                        )
                        if not existing_cp:
                            session.add(
                                CoursePrerequisite(
                                    course_id=course.id,
                                    prerequisite_course_id=prereq_course.id,
                                    )
                            )

            # 5. Seed Demo Assessments and Educational Questions
            for ass_info in DEMO_ASSESSMENTS:
                assessment = (
                    session.query(Assessment)
                    .filter(Assessment.title == ass_info["title"])
                    .first()
                )
                if not assessment:
                    assessment = Assessment(
                        title=ass_info["title"],
                        description=ass_info["description"],
                        instructions=ass_info["instructions"],
                        duration_minutes=ass_info["duration_minutes"],
                        difficulty=ass_info["difficulty"],
                        status=ass_info["status"],
                    )
                    session.add(assessment)
                    session.flush()
                    logger.info(f"Seeded assessment: {ass_info['title']}")

                # Seed questions for this assessment
                for q_info in ass_info.get("questions", []):
                    existing_q = (
                        session.query(Question)
                        .filter(
                            Question.assessment_id == assessment.id,
                            Question.sequence_order == q_info["sequence_order"],
                        )
                        .first()
                    )
                    if not existing_q:
                        target_comp = comps_by_code.get(q_info["competency_code"])
                        comp_id = target_comp.id if target_comp else None
                        question = Question(
                            assessment_id=assessment.id,
                            competency_id=comp_id,
                            question_text=q_info["question_text"],
                            question_type=q_info["question_type"],
                            difficulty=q_info["difficulty"],
                            option_a=q_info["option_a"],
                            option_b=q_info["option_b"],
                            option_c=q_info["option_c"],
                            option_d=q_info["option_d"],
                            correct_option=q_info["correct_option"],
                            explanation=q_info["explanation"],
                            points=q_info["points"],
                            sequence_order=q_info["sequence_order"],
                        )
                        session.add(question)

            # 6. Seed Demo Departments and Users
            demo_depts = [
                {"name": "Survey Design and Research Division (SDRD)", "code": "SDRD", "description": "MoSPI Survey Design and Research Division"},
                {"name": "National Accounts Division & Training Wing", "code": "NAD", "description": "MoSPI National Accounts Division & Training Wing"},
                {"name": "National Statistical Systems Training Academy (NSSTA)", "code": "NSSTA", "description": "National Statistical Systems Training Academy"},
            ]
            depts_by_code = {}
            for d_info in demo_depts:
                dept = session.query(Department).filter(Department.code == d_info["code"]).first()
                if not dept:
                    dept = Department(
                        name=d_info["name"],
                        code=d_info["code"],
                        description=d_info["description"],
                    )
                    session.add(dept)
                    session.flush()
                depts_by_code[d_info["code"]] = dept

            role_learner = session.query(Role).filter(Role.name == "LEARNER").first()
            role_admin = session.query(Role).filter(Role.name == "ADMIN").first()
            role_trainer = session.query(Role).filter(Role.name == "TRAINER").first()

            demo_users = [
                {
                    "official_id": "SSS-2021-0892",
                    "email": "arjun.kumar@mospi.gov.in",
                    "full_name": "Arjun Kumar",
                    "role_id": role_learner.id if role_learner else None,
                    "department_id": depts_by_code.get("SDRD").id if depts_by_code.get("SDRD") else None,
                    "designation": "Statistical Investigator",
                    "experience_years": 4.0,
                },
                {
                    "official_id": "ISS-2012-0198",
                    "email": "priya.sharma@mospi.gov.in",
                    "full_name": "Dr. Priya Sharma",
                    "role_id": role_admin.id if role_admin else None,
                    "department_id": depts_by_code.get("NAD").id if depts_by_code.get("NAD") else None,
                    "designation": "Administrator",
                    "experience_years": 14.0,
                },
                {
                    "official_id": "TRN-2016-0089",
                    "email": "rahul.verma@nssta.gov.in",
                    "full_name": "Rahul Verma",
                    "role_id": role_trainer.id if role_trainer else None,
                    "department_id": depts_by_code.get("NSSTA").id if depts_by_code.get("NSSTA") else None,
                    "designation": "Training Officer",
                    "experience_years": 9.0,
                },
            ]

            seeded_users = {}
            for u_data in demo_users:
                user = session.query(User).filter(User.email == u_data["email"]).first()
                if not user:
                    user = User(
                        official_id=u_data["official_id"],
                        email=u_data["email"],
                        full_name=u_data["full_name"],
                        password_hash=hash_password("demo123"),
                        role_id=u_data["role_id"],
                        department_id=u_data["department_id"],
                        designation=u_data["designation"],
                        experience_years=u_data["experience_years"],
                        is_active=True,
                    )
                    session.add(user)
                    session.flush()
                seeded_users[u_data["email"]] = user

            # Seed initial competency profile for Arjun Kumar (Learner)
            arjun = seeded_users.get("arjun.kumar@mospi.gov.in")
            if arjun:
                learner_comps = [
                    ("TECH_PY", 2.2, 0.85),
                    ("TECH_SQL", 2.8, 0.80),
                    ("STAT_SAMPLING", 3.2, 0.90),
                    ("STAT_QUALITY", 2.5, 0.75),
                    ("TECH_VIZ", 3.0, 0.82),
                    ("TECH_GIS", 3.5, 0.88),
                ]
                for code, lvl, conf in learner_comps:
                    comp_obj = comps_by_code.get(code)
                    if comp_obj:
                        existing_uc = (
                            session.query(UserCompetency)
                            .filter(
                                UserCompetency.user_id == arjun.id,
                                UserCompetency.competency_id == comp_obj.id,
                            )
                            .first()
                        )
                        if not existing_uc:
                            session.add(
                                UserCompetency(
                                    user_id=arjun.id,
                                    competency_id=comp_obj.id,
                                    current_level=lvl,
                                    confidence_score=conf,
                                )
                            )

            session.commit()
            logger.info("Database seed verification complete.")
    except Exception as exc:
        logger.warning(f"Could not complete database seeding: {exc}")


def init_db(raise_on_error: bool = False) -> bool:
    """Initialize database tables for development and seed essential data.

    NOTE:
    In development mode, `Base.metadata.create_all(bind=engine)` automatically
    creates all missing tables. For production environments, Alembic migrations
    should be used instead.
    """
    safe_db_url = engine.url.render_as_string(hide_password=True)
    logger.info(f"Initializing database tables at: {safe_db_url}")

    try:
        # Create all tables registered with Base.metadata
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified and initialized successfully.")

        # Ensure backward-compatible schema updates for SQLite development database
        try:
            with engine.begin() as conn:
                from sqlalchemy import text
                if engine.url.drivername.startswith("sqlite"):
                    user_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
                    if "phone_number" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)"))

                    prof_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(user_profiles)")).fetchall()]
                    if "competency_initialized" not in prof_cols:
                        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN competency_initialized BOOLEAN DEFAULT 0 NOT NULL"))
        except Exception as col_err:
            logger.debug(f"Column verification notice: {col_err}")

        # Seed initial system roles, competencies, benchmarks, and demo courses
        seed_database_data()
        return True
    except OperationalError as exc:
        logger.error(
            f"Database Connection Error: Could not connect to PostgreSQL server at [{safe_db_url}]. "
            "Please ensure that PostgreSQL is installed, running, and that DATABASE_URL in your .env "
            "contains valid connection parameters. (Details: %s)",
            exc.orig if hasattr(exc, "orig") else exc,
        )
        if raise_on_error:
            raise
        return False
    except SQLAlchemyError as exc:
        logger.error(
            f"SQLAlchemy Database Error during table initialization on [{safe_db_url}]: {exc}"
        )
        if raise_on_error:
            raise
        return False
