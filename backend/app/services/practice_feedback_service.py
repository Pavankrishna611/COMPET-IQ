"""AI Learning Feedback and Weak-Topic Analysis Service for personal learner practice quizzes."""

import json
import logging
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.competency import Competency
from app.models.course import Course
from app.models.course_competency import CourseCompetency
from app.models.learning_material import LearningMaterial
from app.models.practice_quiz_attempt import PracticeQuizAttempt
from app.models.user import User
from app.schemas.ai_assessment import (
    CompetencyReference,
    CourseReference,
    PracticeFeedbackResponse,
    WeakTopicAnalysis,
)
from app.services.competency_analysis_service import COMPETENCY_KEYWORD_MAP, _matches_keyword
from app.services.question_generation_service import OpenAILLMProvider

logger = logging.getLogger("competiq.services.practice_feedback")


class PracticeFeedbackService:
    """Service that provides AI-powered learning feedback and weak-topic analysis
    based strictly on a learner's personal practice quiz results.
    
    GUARANTEES:
    - Formative Personal Practice only: never alters user_competencies or official assessments.
    - Strict authorization: only the authenticated attempt owner can view or generate feedback.
    - Zero fake entities: mapped competencies and recommended courses use strictly existing DB records.
    - Transparent fallback: clearly marks whether feedback was synthesized via external LLM or Mock provider.
    """

    @classmethod
    def get_or_generate_feedback(
        cls,
        db: Session,
        current_user: User,
        attempt_id: uuid.UUID,
        force_regenerate: bool = False,
    ) -> PracticeFeedbackResponse:
        """Retrieve existing feedback or synthesize fresh AI feedback for a completed practice attempt."""
        attempt = (
            db.query(PracticeQuizAttempt)
            .filter(PracticeQuizAttempt.id == attempt_id)
            .first()
        )
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Practice quiz attempt '{attempt_id}' not found.",
            )

        # 1. Strict ownership authorization
        if attempt.user_id != current_user.id:
            logger.warning(
                f"Unauthorized feedback access: User {current_user.id} tried to access attempt {attempt.id} of user {attempt.user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view or generate feedback for this practice quiz attempt.",
            )

        # 2. Strict attempt completion validation
        attempt_status = getattr(attempt, "status", "COMPLETED")
        if (
            attempt_status != "COMPLETED"
            or not attempt.submitted_answers
            or attempt.total_questions == 0
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Practice quiz attempt is not completed. Feedback can only be generated for submitted quizzes.",
            )

        # 3. Return cached feedback if available and regeneration is not forced
        if not force_regenerate and attempt.ai_feedback:
            try:
                return PracticeFeedbackResponse(**attempt.ai_feedback)
            except Exception as e:
                logger.warning(f"Error parsing cached feedback for attempt {attempt.id}: {e}. Regenerating.")

        # 4. Fetch learning material for context
        material = (
            db.query(LearningMaterial)
            .filter(LearningMaterial.id == attempt.learning_material_id)
            .first()
        )
        material_title = material.title if material else "Learning Material"

        # 5. Analyze submitted answers (strengths, weak topics, mistake patterns)
        submitted = attempt.submitted_answers or []
        correct_items = [q for q in submitted if q.get("is_correct") is True]
        incorrect_items = [q for q in submitted if not q.get("is_correct")]

        # Group by topic
        topic_stats: Dict[str, Dict[str, Any]] = {}
        for q in submitted:
            t = (q.get("topic") or "Core Concepts").strip()
            diff = (q.get("difficulty") or "MEDIUM").strip().upper()
            if t not in topic_stats:
                topic_stats[t] = {
                    "total": 0,
                    "missed": 0,
                    "correct": 0,
                    "diffs": {"EASY": 0, "MEDIUM": 0, "HARD": 0},
                    "questions": [],
                }
            topic_stats[t]["total"] += 1
            if q.get("is_correct"):
                topic_stats[t]["correct"] += 1
            else:
                topic_stats[t]["missed"] += 1
                topic_stats[t]["diffs"][diff] = topic_stats[t]["diffs"].get(diff, 0) + 1
            topic_stats[t]["questions"].append(q)

        # Identify weak topics
        weak_topics: List[WeakTopicAnalysis] = []
        for topic_name, stats in topic_stats.items():
            if stats["missed"] > 0:
                miss_rate = round((stats["missed"] / stats["total"]) * 100.0, 1)
                diagnosis = cls._build_topic_diagnosis(
                    topic=topic_name,
                    missed=stats["missed"],
                    total=stats["total"],
                    miss_rate=miss_rate,
                    diff_spread=stats["diffs"],
                )
                weak_topics.append(
                    WeakTopicAnalysis(
                        topic=topic_name,
                        missed_count=stats["missed"],
                        total_count=stats["total"],
                        miss_rate=miss_rate,
                        diagnosis=diagnosis,
                        difficulty_spread=stats["diffs"],
                    )
                )

        # Sort weak topics by miss rate descending
        weak_topics.sort(key=lambda x: (x.miss_rate, x.missed_count), reverse=True)

        # 6. Map weak topics and skills to real platform competencies (no invented IDs)
        mapped_competencies = cls._map_to_real_competencies(
            db=db,
            weak_topics=[wt.topic for wt in weak_topics],
            material_title=material_title,
        )

        # 7. Recommend real catalog courses linked to mapped competencies (no invented IDs)
        recommended_courses = cls._recommend_real_courses(
            db=db,
            competency_ids=[c.id for c in mapped_competencies],
            material_title=material_title,
        )

        # 8. Synthesize AI / Mock Feedback
        provider_name = (settings.LLM_PROVIDER or "").lower().strip()
        api_key = (settings.LLM_API_KEY or "").strip()

        ai_narrative: Optional[Dict[str, Any]] = None
        generation_mode = "MOCK_FALLBACK"
        is_mock = True

        if provider_name == "openai" and api_key:
            try:
                ai_narrative = cls._synthesize_with_openai(
                    api_key=api_key,
                    model=settings.LLM_MODEL,
                    material_title=material_title,
                    total=attempt.total_questions,
                    correct=attempt.correct_answers,
                    incorrect=attempt.incorrect_answers,
                    score=attempt.score,
                    percentage=attempt.percentage,
                    weak_topics=weak_topics,
                    correct_items=correct_items,
                    incorrect_items=incorrect_items,
                )
                if ai_narrative:
                    generation_mode = "AI"
                    is_mock = False
            except Exception as exc:
                logger.warning(
                    f"External LLM generation failed for practice attempt {attempt.id}: {exc}. "
                    f"Falling back to deterministic mock feedback provider."
                )

        if not ai_narrative:
            ai_narrative = cls._synthesize_mock_feedback(
                material_title=material_title,
                total=attempt.total_questions,
                correct=attempt.correct_answers,
                incorrect=attempt.incorrect_answers,
                percentage=attempt.percentage,
                weak_topics=weak_topics,
                correct_items=correct_items,
                incorrect_items=incorrect_items,
            )

        feedback_response = PracticeFeedbackResponse(
            attempt_id=attempt.id,
            learning_material_id=attempt.learning_material_id,
            material_title=material_title,
            total_questions=attempt.total_questions,
            correct_answers=attempt.correct_answers,
            incorrect_answers=attempt.incorrect_answers,
            score=attempt.score,
            percentage=attempt.percentage,
            time_taken_seconds=attempt.time_taken_seconds,
            overall_summary=ai_narrative["overall_summary"],
            strengths=ai_narrative["strengths"],
            weak_topics=weak_topics,
            weak_skills=ai_narrative["weak_skills"],
            improvement_areas=ai_narrative["improvement_areas"],
            recommended_next_steps=ai_narrative["recommended_next_steps"],
            mapped_competencies=mapped_competencies,
            recommended_courses=recommended_courses,
            generation_mode=generation_mode,
            is_mock_fallback=is_mock,
            created_at=datetime.utcnow(),
            disclaimer="Formative personal practice feedback only. Does not alter official competency scores or assessment records.",
        )

        # 9. Cache feedback directly on practice attempt
        attempt.ai_feedback = feedback_response.model_dump(mode="json")
        db.commit()

        logger.info(
            f"Generated practice quiz feedback for user {current_user.id} (attempt {attempt.id}) "
            f"via {generation_mode}. Weak topics: {len(weak_topics)}, Mapped comps: {len(mapped_competencies)}"
        )
        return feedback_response

    @classmethod
    def _build_topic_diagnosis(
        cls,
        topic: str,
        missed: int,
        total: int,
        miss_rate: float,
        diff_spread: Dict[str, int],
    ) -> str:
        """Formulate a concise educational diagnosis for a specific weak topic."""
        diff_desc = []
        if diff_spread.get("HARD", 0) > 0:
            diff_desc.append(f"{diff_spread['HARD']} advanced")
        if diff_spread.get("MEDIUM", 0) > 0:
            diff_desc.append(f"{diff_spread['MEDIUM']} intermediate")
        if diff_spread.get("EASY", 0) > 0:
            diff_desc.append(f"{diff_spread['EASY']} foundational")
        
        diff_str = f" ({', '.join(diff_desc)} difficulty)" if diff_desc else ""

        if miss_rate >= 80.0:
            return (
                f"Significant comprehension gap in '{topic}' with {missed} of {total} questions missed{diff_str}. "
                f"Recommend thoroughly re-reading foundational methodology sections."
            )
        elif miss_rate >= 50.0:
            return (
                f"Moderate ambiguity in '{topic}' ({missed}/{total} missed{diff_str}). "
                f"Focus on distinguishing nuanced criteria and verification formulas."
            )
        else:
            return (
                f"Minor slip-up in '{topic}' ({missed}/{total} missed{diff_str}). "
                f"Review specific question rationale to solidify edge-case mastery."
            )

    @classmethod
    def _map_to_real_competencies(
        cls,
        db: Session,
        weak_topics: List[str],
        material_title: str,
    ) -> List[CompetencyReference]:
        """Map identified weak topics strictly to existing database competencies (never invent IDs)."""
        db_competencies = db.query(Competency).all()
        if not db_competencies:
            return []

        comp_by_code = {c.code: c for c in db_competencies}
        matched_comps: Set[Competency] = set()

        # Combine weak topic tokens with material title
        search_terms = list(weak_topics)
        search_terms.append(material_title)

        for term in search_terms:
            t_clean = term.lower()

            # 1. Match against known keyword dictionary
            for code, keywords in COMPETENCY_KEYWORD_MAP.items():
                for kw in keywords:
                    if _matches_keyword(kw, t_clean):
                        if code in comp_by_code:
                            matched_comps.add(comp_by_code[code])
                            break

            # 2. Match against competency name / description
            for comp in db_competencies:
                c_name = comp.name.lower()
                if c_name in t_clean or t_clean in c_name:
                    matched_comps.add(comp)

        # Convert to strict schema references with real UUIDs
        return [
            CompetencyReference(
                id=c.id,
                code=c.code,
                name=c.name,
                domain=c.domain,
                category=c.category,
            )
            for c in sorted(matched_comps, key=lambda x: x.name)
        ]

    @classmethod
    def _recommend_real_courses(
        cls,
        db: Session,
        competency_ids: List[uuid.UUID],
        material_title: str,
    ) -> List[CourseReference]:
        """Fetch existing catalog courses linked to mapped competencies (never invent courses)."""
        courses: List[Course] = []

        if competency_ids:
            courses = (
                db.query(Course)
                .join(CourseCompetency, CourseCompetency.course_id == Course.id)
                .filter(
                    CourseCompetency.competency_id.in_(competency_ids),
                    Course.is_active.is_(True),
                )
                .distinct()
                .limit(3)
                .all()
            )

        # If no competency links exist, fallback to courses matching material title keywords
        if not courses:
            tokens = [w for w in re.split(r"\W+", material_title) if len(w) > 3]
            for token in tokens:
                matched = (
                    db.query(Course)
                    .filter(
                        Course.is_active.is_(True),
                        Course.title.ilike(f"%{token}%"),
                    )
                    .limit(3)
                    .all()
                )
                if matched:
                    courses = matched
                    break

        # Fallback to general active courses if still empty
        if not courses:
            courses = db.query(Course).filter(Course.is_active.is_(True)).limit(2).all()

        return [
            CourseReference(
                id=c.id,
                title=c.title,
                provider=c.provider,
                domain=c.domain,
                difficulty=c.difficulty,
                duration_hours=c.duration_hours,
                url=c.url,
            )
            for c in courses
        ]

    @classmethod
    def _synthesize_with_openai(
        cls,
        api_key: str,
        model: Optional[str],
        material_title: str,
        total: int,
        correct: int,
        incorrect: int,
        score: float,
        percentage: float,
        weak_topics: List[WeakTopicAnalysis],
        correct_items: List[Dict[str, Any]],
        incorrect_items: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """Invoke external OpenAI LLM to generate structured educational feedback."""
        system_prompt = (
            "You are an expert AI tutor specializing in institutional statistics, data science, and technical education. "
            "Analyze the learner's personal practice quiz results and generate encouraging, diagnostic, and actionable feedback. "
            "You must return ONLY a valid JSON object matching the requested schema with no extra text."
        )

        user_payload = {
            "material_title": material_title,
            "performance": {
                "total_questions": total,
                "correct_answers": correct,
                "incorrect_answers": incorrect,
                "score": score,
                "percentage": percentage,
            },
            "weak_topics": [wt.model_dump() for wt in weak_topics],
            "sample_incorrect_questions": [
                {
                    "question": item.get("question_text"),
                    "selected": item.get("selected_option"),
                    "correct": item.get("correct_option"),
                    "topic": item.get("topic"),
                    "explanation": item.get("explanation"),
                }
                for item in incorrect_items[:4]
            ],
            "sample_correct_topics": list({item.get("topic") for item in correct_items if item.get("topic")}),
        }

        user_prompt = (
            f"Analyze this learner practice quiz performance and return a JSON object with keys:\n"
            f"- 'overall_summary': str (concise 2-3 sentence overview of performance and focus)\n"
            f"- 'strengths': list of str (2-3 specific observed strengths)\n"
            f"- 'weak_skills': list of str (2-3 specific micro-skills or formulas needing revision)\n"
            f"- 'improvement_areas': list of str (2-3 high-impact concept areas to study)\n"
            f"- 'recommended_next_steps': list of str (3 actionable next steps for the learner)\n\n"
            f"DATA:\n{json.dumps(user_payload)}"
        )

        provider = OpenAILLMProvider(api_key=api_key, model=model)
        raw_res = provider.generate(system_prompt=system_prompt, user_prompt=user_prompt)

        cleaned = raw_res.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        parsed = json.loads(cleaned)
        required_keys = ["overall_summary", "strengths", "weak_skills", "improvement_areas", "recommended_next_steps"]
        if all(k in parsed for k in required_keys):
            return parsed
        return None

    @classmethod
    def _synthesize_mock_feedback(
        cls,
        material_title: str,
        total: int,
        correct: int,
        incorrect: int,
        percentage: float,
        weak_topics: List[WeakTopicAnalysis],
        correct_items: List[Dict[str, Any]],
        incorrect_items: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Deterministic mock synthesis guaranteeing educational, actionable, and coherent feedback."""
        # 1. Overall Summary
        if percentage >= 80.0:
            summary = (
                f"Excellent mastery demonstrated on '{material_title}'. You achieved a score of {percentage}%, "
                f"showing strong foundational knowledge and precise problem-solving."
            )
        elif percentage >= 60.0:
            summary = (
                f"Solid practice effort on '{material_title}'. You scored {percentage}% ({correct}/{total} correct). "
                f"Targeted review of key diagnostic topics will help bridge remaining conceptual gaps."
            )
        else:
            summary = (
                f"Valuable formative baseline established on '{material_title}'. With a score of {percentage}%, "
                f"concentrated revision on core definitions and calculation procedures is recommended before retaking."
            )

        # 2. Strengths
        strengths: List[str] = []
        correct_topics = list({q.get("topic") for q in correct_items if q.get("topic")})
        if correct_topics:
            for t in correct_topics[:3]:
                strengths.append(f"Demonstrated solid grasp and correct application in '{t}'.")
        else:
            strengths.append(f"Persistence and engagement in completing the {total}-question formative practice session.")

        if correct > 0:
            strengths.append(f"Accurately answered {correct} question{'s' if correct > 1 else ''} across the practice set.")

        # 3. Weak Skills & Mistake Patterns
        weak_skills: List[str] = []
        improvement_areas: List[str] = []

        if weak_topics:
            top_weak = weak_topics[0]
            weak_skills.append(f"Differentiating core concepts and operational rules within '{top_weak.topic}'.")
            improvement_areas.append(f"Study source material guidelines concerning '{top_weak.topic}' ({top_weak.missed_count} missed).")

        if len(weak_topics) > 1:
            second_weak = weak_topics[1]
            weak_skills.append(f"Applying procedural criteria and consistency checks in '{second_weak.topic}'.")
            improvement_areas.append(f"Review practical examples and boundary conditions in '{second_weak.topic}'.")

        # Fallback if 100% correct or no weak topics
        if not weak_skills:
            weak_skills.append("Synthesizing complex multi-stage problems under tighter time constraints.")
            improvement_areas.append("Challenge yourself with higher difficulty questions to advance to expert level.")

        # 4. Actionable Next Steps
        recommended_next_steps: List[str] = []
        if incorrect > 0:
            recommended_next_steps.append(
                f"Review the step-by-step educational explanations for the {incorrect} missed question{'s' if incorrect > 1 else ''}."
            )
        if weak_topics:
            wt_names = ", ".join([f"'{wt.topic}'" for wt in weak_topics[:2]])
            recommended_next_steps.append(
                f"Re-read relevant sections of '{material_title}' focusing specifically on {wt_names}."
            )
        recommended_next_steps.append(
            f"Generate a targeted 5-question follow-up practice quiz to verify knowledge retention."
        )

        return {
            "overall_summary": summary,
            "strengths": strengths,
            "weak_skills": weak_skills,
            "improvement_areas": improvement_areas,
            "recommended_next_steps": recommended_next_steps,
        }
