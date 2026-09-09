"""AI-based Professional Profile Analysis and Competency Suggestion Service."""

import json
import logging
import re
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.competency import Competency
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.user_skill_declaration import UserSkillDeclaration
from app.schemas.onboarding import (
    AcceptCompetenciesRequest,
    AcceptCompetenciesResponse,
    ProfileAnalysisRequest,
    SuggestedCompetencyResponse,
)
from app.services.competency_initialization_service import CompetencyInitializationService

logger = logging.getLogger("competiq.services.competency_analysis")


@dataclass
class LearnerProfileContext:
    """Normalized representation of 10-field learner professional profile."""

    designation: str = ""
    department: str = ""
    job_role: str = ""
    current_assignment: str = ""
    education_level: str = ""
    specialization: str = ""
    experience_years: float = 0.0
    current_work_area: str = ""
    previous_trainings: str = ""
    career_goal: str = ""


# Official competency keyword catalog mapped to standard competency codes
COMPETENCY_KEYWORD_MAP: Dict[str, List[str]] = {
    "TECH_PY": ["python", "pandas", "numpy", "django", "fastapi", "scripting", "py"],
    "TECH_SQL": ["sql", "database", "postgres", "mysql", "queries", "relational", "rdbms", "data warehousing"],
    "TECH_R": ["r programming", "r language", "cran", "bioconductor", "r-stat", "r"],
    "TECH_GIS": ["gis", "spatial", "qgis", "arcgis", "mapping", "geospatial", "remote sensing", "cartography"],
    "TECH_VIZ": ["data visualization", "visualization", "power bi", "powerbi", "tableau", "dashboard", "charts", "d3", "infographics"],
    "TECH_AIML": ["ai", "machine learning", "ml", "deep learning", "neural", "nlp", "llm", "predictive model", "artificial intelligence", "data science"],
    "TECH_CLOUD": ["cloud", "aws", "azure", "gcp", "devops", "docker", "kubernetes", "cloud computing"],
    "STAT_SURVEY": ["survey design", "survey", "questionnaire", "field survey", "nss", "sdrd", "census", "data collection", "cawi", "capi"],
    "STAT_SAMPLING": ["sampling", "sample design", "stratified", "cluster sampling", "sample survey", "sampling error", "probability sampling"],
    "STAT_NAT_ACC": ["national accounts", "gdp", "gva", "macroeconomic", "input-output", "nad", "economic aggregate", "capital formation"],
    "STAT_PRICE": ["price statistics", "cpi", "wpi", "consumer price", "wholesale price", "inflation", "index numbers", "esd", "price index"],
    "STAT_LABOUR": ["labour statistics", "labour", "labor", "plfs", "employment", "unemployment", "workforce", "periodic labour"],
    "STAT_QUALITY": ["data quality", "quality assurance", "validation", "scrutiny", "cleansing", "dqad", "data verification", "auditing", "consistency check"],
    "GOV_CYBER": ["cybersecurity", "cyber", "information security", "threat", "vulnerability", "infosec", "cert-in", "firewall", "security audit"],
    "GOV_PRIVACY": ["data privacy", "privacy", "data protection", "dpdp", "confidentiality", "anonymization", "gdpr", "personally identifiable"],
    "GOV_DIGI_SIG": ["digital signatures", "digital signature", "dsc", "pki", "cryptography", "authentication", "e-sign", "token"],
    "GOV_CLOUD": ["government cloud", "meghraj", "nic cloud", "e-gov infrastructure", "gov cloud", "cloud first", "government data center"],
    "BEH_LEAD": ["leadership", "leading", "team lead", "director", "mentor", "vision", "superintend", "head of division", "leadership development"],
    "BEH_COMM": ["communication", "stakeholder", "presentation", "dissemination", "briefing", "report writing", "public speaking"],
    "BEH_PM": ["project management", "project", "pmp", "milestones", "monitoring", "program management", "agile", "deliverables", "timelines"],
    "BEH_ETHICS": ["ethics", "code of conduct", "integrity", "public interest", "official ethics", "transparency", "impartiality"],
    "BEH_DECISION": ["decision making", "decision", "evidence-based", "policy making", "strategic planning", "executive decision"],
}


def _matches_keyword(keyword: str, text: str) -> bool:
    """Safe keyword matching enforcing regex word boundary for short tokens (<= 3 chars)."""
    if not keyword or not text:
        return False
    kw = keyword.strip().lower()
    tx = text.lower()
    if len(kw) <= 3:
        return bool(re.search(rf"\b{re.escape(kw)}\b", tx))
    return bool(re.search(rf"\b{re.escape(kw)}\b", tx)) or kw in tx


class CompetencyAnalysisService:
    """Service that analyzes learner professional profile and recommends tailored competencies."""

    @classmethod
    def _resolve_profile_context(
        cls,
        db_profile: Optional[UserProfile],
        override: Optional[Any],
    ) -> Optional[LearnerProfileContext]:
        """Merge database profile record with any override data provided in the request."""
        designation = db_profile.designation if db_profile and db_profile.designation else ""
        department = ""
        if db_profile:
            if db_profile.department:
                department = (
                    db_profile.department.name
                    if hasattr(db_profile.department, "name")
                    else str(db_profile.department)
                )
            elif db_profile.current_work_area:
                department = db_profile.current_work_area

        job_role = db_profile.job_role if db_profile and db_profile.job_role else ""
        current_assignment = db_profile.current_assignment if db_profile and db_profile.current_assignment else ""
        education_level = db_profile.education_level if db_profile and db_profile.education_level else ""
        specialization = db_profile.specialization if db_profile and db_profile.specialization else ""
        experience_years = float(db_profile.experience_years or 0.0) if db_profile else 0.0
        current_work_area = db_profile.current_work_area if db_profile and db_profile.current_work_area else ""
        previous_trainings = db_profile.previous_trainings if db_profile and db_profile.previous_trainings else ""
        career_goal = db_profile.professional_goal if db_profile and db_profile.professional_goal else ""

        if override is not None:
            if isinstance(override, dict):
                designation = override.get("designation") or designation
                department = override.get("department") or department
                job_role = override.get("job_role") or job_role
                current_assignment = (
                    override.get("current_assignment")
                    or override.get("assignment")
                    or current_assignment
                )
                education_level = (
                    override.get("education_level")
                    or override.get("education")
                    or education_level
                )
                specialization = override.get("specialization") or specialization
                raw_exp = override.get("experience_years") if "experience_years" in override else override.get("experience")
                if raw_exp is not None:
                    try:
                        experience_years = float(raw_exp)
                    except (ValueError, TypeError):
                        m = re.search(r"(\d+(\.\d+)?)", str(raw_exp))
                        if m:
                            experience_years = float(m.group(1))
                current_work_area = override.get("current_work_area") or current_work_area
                previous_trainings = override.get("previous_trainings") or previous_trainings
                career_goal = (
                    override.get("career_goal")
                    or override.get("professional_goal")
                    or career_goal
                )
            elif hasattr(override, "__dict__") or isinstance(override, ProfileAnalysisRequest):
                get_attr = lambda a: getattr(override, a, None)
                designation = get_attr("designation") or designation
                department = get_attr("department") or department
                job_role = get_attr("job_role") or job_role
                current_assignment = (
                    get_attr("current_assignment")
                    or get_attr("assignment")
                    or current_assignment
                )
                education_level = (
                    get_attr("education_level")
                    or get_attr("education")
                    or education_level
                )
                specialization = get_attr("specialization") or specialization
                raw_exp = (
                    get_attr("experience_years")
                    if get_attr("experience_years") is not None
                    else get_attr("experience")
                )
                if raw_exp is not None:
                    try:
                        experience_years = float(raw_exp)
                    except (ValueError, TypeError):
                        m = re.search(r"(\d+(\.\d+)?)", str(raw_exp))
                        if m:
                            experience_years = float(m.group(1))
                current_work_area = get_attr("current_work_area") or current_work_area
                previous_trainings = get_attr("previous_trainings") or previous_trainings
                career_goal = (
                    get_attr("career_goal")
                    or get_attr("professional_goal")
                    or career_goal
                )

        has_data = bool(
            designation
            or department
            or job_role
            or current_assignment
            or specialization
            or career_goal
            or experience_years > 0
            or db_profile is not None
        )
        if not has_data:
            return None

        return LearnerProfileContext(
            designation=designation.strip(),
            department=department.strip(),
            job_role=job_role.strip(),
            current_assignment=current_assignment.strip(),
            education_level=education_level.strip(),
            specialization=specialization.strip(),
            experience_years=max(0.0, experience_years),
            current_work_area=current_work_area.strip(),
            previous_trainings=previous_trainings.strip(),
            career_goal=career_goal.strip(),
        )

    @classmethod
    def analyze_profile(
        cls,
        db: Session,
        user: User,
        profile_override: Optional[Any] = None,
    ) -> List[SuggestedCompetencyResponse]:
        """Analyze learner's professional profile against the COMPETIQ competency framework."""
        db_profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        profile_context = cls._resolve_profile_context(db_profile=db_profile, override=profile_override)

        if not profile_context:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Please complete your professional profile first.",
            )

        all_competencies = db.query(Competency).all()
        if not all_competencies:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No competency framework records available in database.",
            )

        # Attempt LLM query if provider and key are configured
        if settings.LLM_API_KEY and settings.LLM_PROVIDER:
            try:
                llm_results = cls._analyze_with_llm(
                    profile_ctx=profile_context, competencies=all_competencies
                )
                if llm_results and len(llm_results) >= 3:
                    return llm_results
            except Exception as exc:
                logger.warning(f"LLM analysis failed, falling back to contextual analysis engine: {exc}")

        # Deterministic Contextual Recommendation Engine
        return cls._analyze_with_contextual_engine(
            profile_ctx=profile_context, competencies=all_competencies
        )

    @classmethod
    def _analyze_with_llm(
        cls,
        profile_ctx: LearnerProfileContext,
        competencies: List[Competency],
    ) -> Optional[List[SuggestedCompetencyResponse]]:
        """Query LLM provider for structured competency suggestions mapped to framework."""
        import httpx

        comp_catalog = [
            {"id": str(c.id), "name": c.name, "domain": c.domain, "description": c.description}
            for c in competencies
        ]

        system_prompt = (
            "You are the Chief Competency Architect for India's Official Statistical System (MoSPI/COMPETIQ). "
            "Analyze the given official learner profile and recommend 4 to 6 most relevant competencies "
            "strictly from the provided COMPETIQ competency framework. "
            "Return ONLY a JSON array of objects matching: "
            '{"competency_name": "...", "domain": "...", "relevance_reason": "...", "required_level": 4.0, "priority": "CRITICAL|HIGH|MEDIUM"}.'
        )

        user_content = {
            "designation": profile_ctx.designation,
            "department": profile_ctx.department or profile_ctx.current_work_area,
            "job_role": profile_ctx.job_role,
            "current_assignment": profile_ctx.current_assignment,
            "education": profile_ctx.education_level,
            "specialization": profile_ctx.specialization,
            "experience_years": profile_ctx.experience_years,
            "previous_trainings": profile_ctx.previous_trainings,
            "career_goal": profile_ctx.career_goal,
            "competency_framework": comp_catalog,
        }

        endpoint = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.LLM_MODEL or "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_content)},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        resp = httpx.post(endpoint, headers=headers, json=payload, timeout=20.0)
        if resp.status_code != 200:
            return None

        data = resp.json()
        raw_text = data["choices"][0]["message"]["content"]
        parsed = json.loads(raw_text)
        items = parsed.get("competencies") or parsed.get("recommendations") or parsed

        comp_name_map = {c.name.lower(): c for c in competencies}
        suggestions: List[SuggestedCompetencyResponse] = []

        for item in items:
            name = item.get("competency_name", "")
            comp = comp_name_map.get(name.lower())
            if comp:
                suggestions.append(
                    SuggestedCompetencyResponse(
                        competency_id=comp.id,
                        competency_name=comp.name,
                        domain=comp.domain,
                        relevance_reason=item.get(
                            "relevance_reason",
                            f"Identified as highly relevant for your role as {profile_ctx.job_role or 'Statistical Officer'}.",
                        ),
                        required_level=float(item.get("required_level", 4.0)),
                        priority=str(item.get("priority", "HIGH")).upper(),
                    )
                )

        return suggestions if len(suggestions) >= 3 else None

    @classmethod
    def _analyze_with_contextual_engine(
        cls,
        profile_ctx: LearnerProfileContext,
        competencies: List[Competency],
    ) -> List[SuggestedCompetencyResponse]:
        """Deterministic profile-sensitive recommendation engine matching COMPETIQ framework."""
        role_str = f"{profile_ctx.job_role} {profile_ctx.designation}".lower()
        dept_str = f"{profile_ctx.department} {profile_ctx.current_work_area}".lower()
        assignment_str = profile_ctx.current_assignment.lower()
        goal_str = profile_ctx.career_goal.lower()
        spec_str = profile_ctx.specialization.lower()
        trainings_str = profile_ctx.previous_trainings.lower()
        exp_years = profile_ctx.experience_years

        comp_scores: Dict[uuid.UUID, Dict[str, Any]] = {}

        for comp in competencies:
            score = 0.0
            reasons: List[str] = []
            comp_keywords = COMPETENCY_KEYWORD_MAP.get(comp.code, [comp.name.lower()])

            # 1. Career Goal Alignment (Highest Priority: 5.5)
            goal_matched = False
            for kw in comp_keywords:
                if _matches_keyword(kw, goal_str):
                    goal_matched = True
                    break
            if goal_matched:
                score += 5.5
                reasons.append(
                    f"Directly advances your stated career objective: '{profile_ctx.career_goal}'."
                )

            # 2. Operational Assignment Alignment (Weight: 3.8)
            assignment_matched = False
            for kw in comp_keywords:
                if _matches_keyword(kw, assignment_str):
                    assignment_matched = True
                    break
            if assignment_matched:
                score += 3.8
                short_assign = (
                    profile_ctx.current_assignment[:50] + "..."
                    if len(profile_ctx.current_assignment) > 50
                    else profile_ctx.current_assignment
                )
                reasons.append(f"Crucial for your operational work in '{short_assign}'.")

            # 3. Job Role & Designation Alignment (Weight: 3.5)
            if "analyst" in role_str or "data" in role_str:
                if comp.code in {"TECH_PY", "TECH_SQL", "TECH_VIZ"}:
                    score += 3.8
                    reasons.append(f"Essential technical pillar for {profile_ctx.job_role or 'Data Analyst'} duties.")
                elif comp.code in {"STAT_QUALITY", "TECH_AIML"}:
                    score += 3.0
                    reasons.append("Supports analytical rigor and data verification.")
            elif any(w in role_str for w in ["investigator", "field", "inspector"]):
                if comp.code in {"STAT_SURVEY", "STAT_SAMPLING", "STAT_QUALITY"}:
                    score += 4.2
                    reasons.append(f"Primary operational methodology for {profile_ctx.job_role or 'Field Investigator'}.")
                elif comp.code in {"TECH_GIS", "TECH_VIZ"}:
                    score += 2.8
                    reasons.append("Supports spatial enumeration and field data reporting.")
            elif any(w in role_str for w in ["director", "superintendent", "joint director", "deputy director"]):
                if comp.code in {"STAT_QUALITY", "BEH_LEAD", "BEH_PM", "BEH_DECISION"}:
                    score += 4.0
                    reasons.append(f"Core executive management competency for {profile_ctx.designation or 'Director'}.")
                elif comp.code in {"GOV_PRIVACY", "STAT_NAT_ACC"}:
                    score += 2.8
                    reasons.append("Key governance and macro-level oversight responsibility.")
            elif any(w in role_str for w in ["officer", "statistician"]):
                if comp.code in {"STAT_QUALITY", "STAT_SAMPLING", "TECH_SQL"}:
                    score += 3.6
                    reasons.append(f"Standard professional requirement for {profile_ctx.designation or 'Statistical Officer'}.")

            # 4. Department & Work Area Alignment (Weight: 3.2)
            if any(w in dept_str for w in ["economic", "esd"]):
                if comp.code in {"STAT_PRICE", "STAT_LABOUR", "STAT_NAT_ACC"}:
                    score += 3.8
                    reasons.append(f"Specialized domain focus for {profile_ctx.department or 'Economic Statistics'}.")
                elif comp.code in {"TECH_SQL", "TECH_VIZ"}:
                    score += 2.4
                    reasons.append("Enables time-series aggregation and price index dashboards.")
            elif any(w in dept_str for w in ["national accounts", "nad"]):
                if comp.code in {"STAT_NAT_ACC", "STAT_PRICE", "STAT_QUALITY"}:
                    score += 4.2
                    reasons.append("Mandatory domain framework for National Accounts & GDP compilation.")
            elif any(w in dept_str for w in ["survey", "sdrd", "sample"]):
                if comp.code in {"STAT_SURVEY", "STAT_SAMPLING", "STAT_QUALITY"}:
                    score += 4.0
                    reasons.append("Foundational competency for Survey Design & Research Division.")
            elif any(w in dept_str for w in ["field", "fod"]):
                if comp.code in {"STAT_SURVEY", "STAT_SAMPLING", "TECH_GIS"}:
                    score += 3.8
                    reasons.append("Central to Field Operations Division surveying and spatial demarcation.")
            elif any(w in dept_str for w in ["quality", "dqad", "scrutiny"]):
                if comp.code in {"STAT_QUALITY", "TECH_SQL", "GOV_PRIVACY"}:
                    score += 4.2
                    reasons.append("Integral for Data Quality Assurance Division protocols.")
            elif any(w in dept_str for w in ["computer", "it", "informatics", "tech"]):
                if comp.code in {"TECH_SQL", "TECH_PY", "TECH_CLOUD", "GOV_CYBER"}:
                    score += 3.8
                    reasons.append("Core IT and technical infrastructure competency.")

            # 5. Academic Specialization & Training Alignment (Weight: 2.2)
            if spec_str:
                if any(w in spec_str for w in ["statistic", "math"]):
                    if comp.code in {"STAT_SAMPLING", "TECH_PY", "STAT_QUALITY"}:
                        score += 2.2
                        reasons.append(f"Builds upon your academic foundation in {profile_ctx.specialization}.")
                elif any(w in spec_str for w in ["computer", "data science", "information technology"]):
                    if comp.code in {"TECH_PY", "TECH_SQL", "TECH_AIML"}:
                        score += 2.2
                        reasons.append(f"Leverages your specialization in {profile_ctx.specialization}.")
                elif any(w in spec_str for w in ["economics", "econometrics"]):
                    if comp.code in {"STAT_NAT_ACC", "STAT_PRICE", "STAT_LABOUR"}:
                        score += 2.2
                        reasons.append(f"Complements your background in {profile_ctx.specialization}.")

            if trainings_str:
                for kw in comp_keywords:
                    if _matches_keyword(kw, trainings_str):
                        score += 1.8
                        reasons.append("Builds further mastery from your previous training coursework.")
                        break

            if score > 0:
                comp_scores[comp.id] = {
                    "competency": comp,
                    "score": score,
                    "reasons": reasons,
                }

        # Sort competencies by total relevance score
        sorted_comps = sorted(comp_scores.values(), key=lambda x: x["score"], reverse=True)
        selected = sorted_comps[:5]

        # If sparse profile yielded fewer than 4 matches, backfill official core capabilities
        if len(selected) < 4:
            already_ids = {item["competency"].id for item in selected}
            foundational_order = ["STAT_QUALITY", "TECH_PY", "TECH_SQL", "STAT_SAMPLING", "GOV_PRIVACY", "BEH_COMM"]
            code_map = {c.code: c for c in competencies}

            for f_code in foundational_order:
                f_comp = code_map.get(f_code)
                if f_comp and f_comp.id not in already_ids:
                    selected.append({
                        "competency": f_comp,
                        "score": 2.0,
                        "reasons": [
                            f"Identified as an official baseline competency recommended for {profile_ctx.job_role or 'learners in public administration'}."
                        ],
                    })
                    already_ids.add(f_comp.id)
                    if len(selected) >= 5:
                        break

        # Calibrate required level and priority
        recommendations: List[SuggestedCompetencyResponse] = []
        for rank, item in enumerate(selected):
            comp: Competency = item["competency"]
            reasons: List[str] = item["reasons"]

            if rank < 2:
                priority = "CRITICAL"
            elif rank < 4:
                priority = "HIGH"
            else:
                priority = "MEDIUM"

            # Level calibration based on professional seniority
            if exp_years >= 5.0 or any(w in role_str for w in ["senior", "director", "officer"]):
                required_level = 4.5 if rank < 2 else 4.0
            elif exp_years >= 2.0:
                required_level = 4.0 if rank < 2 else 3.5
            else:
                required_level = 3.5 if rank < 2 else 3.0

            relevance_reason = (
                " ".join(reasons)
                if reasons
                else f"Identified as a critical competency for your professional role in {profile_ctx.department or 'official statistics'}."
            )

            recommendations.append(
                SuggestedCompetencyResponse(
                    competency_id=comp.id,
                    competency_name=comp.name,
                    domain=comp.domain,
                    relevance_reason=relevance_reason,
                    required_level=required_level,
                    priority=priority,
                )
            )

        return recommendations

    @classmethod
    def accept_competencies(
        cls,
        db: Session,
        user: User,
        request: AcceptCompetenciesRequest,
    ) -> AcceptCompetenciesResponse:
        """Persist accepted competencies into UserSkillDeclaration and initialize baseline competencies."""
        if not request.competencies:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one competency must be accepted to continue.",
            )

        comp_ids = [item.competency_id for item in request.competencies]
        competencies = db.query(Competency).filter(Competency.id.in_(comp_ids)).all()
        comp_map = {c.id: c for c in competencies}

        for c_id in comp_ids:
            if c_id not in comp_map:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Competency with ID '{c_id}' not found in framework.",
                )

        existing_decls = (
            db.query(UserSkillDeclaration)
            .filter(
                UserSkillDeclaration.user_id == user.id,
                UserSkillDeclaration.competency_id.in_(comp_ids),
            )
            .all()
        )
        existing_map = {d.competency_id: d for d in existing_decls}

        for item in request.competencies:
            level = int(round(item.required_level or 3.0))
            level = max(1, min(5, level))
            conf = "HIGH" if item.priority == "CRITICAL" else "MEDIUM"

            if item.competency_id in existing_map:
                decl = existing_map[item.competency_id]
                decl.self_assessed_level = level
                decl.confidence_level = conf
                decl.source = "SELF_DECLARED"
            else:
                new_decl = UserSkillDeclaration(
                    user_id=user.id,
                    competency_id=item.competency_id,
                    self_assessed_level=level,
                    confidence_level=conf,
                    years_of_experience=1.5,
                    source="SELF_DECLARED",
                )
                db.add(new_decl)

        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if profile:
            profile.skills_completed = True
            if profile.onboarding_step < 3:
                profile.onboarding_step = 3

        db.commit()

        # Initialize UserCompetency records safely (anti-overwrite)
        try:
            CompetencyInitializationService.initialize_user_competencies(db=db, user=user)
            db.commit()
        except Exception as init_err:
            logger.warning(f"Notice during competency initialization: {init_err}")

        logger.info(f"Persisted {len(request.competencies)} accepted competencies for user {user.id}")

        return AcceptCompetenciesResponse(
            status="success",
            message="Accepted competencies successfully saved.",
            saved_count=len(request.competencies),
            competency_ids=comp_ids,
        )


competency_analysis_service = CompetencyAnalysisService()
