"""AI and Mock Question Generation Service.

Provides an extensible LLM provider abstraction, structured JSON prompt generation, output parsing, and a deterministic MOCK fallback.
"""

import json
import logging
import re
import uuid
from typing import Any, Dict, List, Optional, Protocol

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.competency import Competency
from app.models.generated_question import GeneratedQuestion
from app.models.learning_material import LearningMaterial
from app.models.user import User
from app.services.content_analysis_service import ContentAnalysisService
from app.services.question_validation_service import QuestionValidationService

logger = logging.getLogger("competiq.services.question_generation")


class LLMProvider(Protocol):
    """Protocol interface defining standard LLM completion generation."""

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Execute text generation against the provider."""
        ...


class MockLLMProvider:
    """Deterministic Mock LLM generator for local development and offline testing."""

    def __init__(self, material_title: str, topics: List[str], keywords: List[str]):
        self.material_title = material_title
        self.topics = topics or ["Statistical Methodology"]
        self.keywords = keywords or ["data", "sample", "metric", "variance", "estimate"]

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Generate high-quality contextual questions deterministically from detected topics and keywords."""
        # Parse count from user prompt (default to 5)
        count_match = re.search(r"Generate (\d+) questions", user_prompt)
        count = int(count_match.group(1)) if count_match else 5

        # Parse difficulty
        diff_match = re.search(r"Difficulty:\s*([A-Z]+)", user_prompt)
        req_diff = diff_match.group(1) if diff_match else "MEDIUM"

        questions: List[Dict[str, Any]] = []

        # Question template pool with contextual parameterization
        templates = [
            (
                "In the context of {topic}, what is the principal objective when working with {keyword}?",
                "To minimize measurement error and ensure unbiased statistical representation.",
                "To convert all categorical data types into string arrays.",
                "To increase file compression ratio during archive exports.",
                "To eliminate the need for primary source verification.",
                "A",
                "Working with {keyword} in {topic} focuses primarily on minimizing measurement error and ensuring statistical validity.",
            ),
            (
                "Which standard procedure is most appropriate when validating {keyword} within {topic}?",
                "Deleting all non-numeric columns from the dataset.",
                "Applying systematic verification rules, outlier thresholds, and consistency checks.",
                "Renaming variable columns to uppercase alphabet letters.",
                "Doubling the sample size without reviewing instrument design.",
                "B",
                "Systematic verification rules and consistency checks are standard practice for validating {keyword} in {topic}.",
            ),
            (
                "When encountering unexpected anomalies in {keyword} during {topic}, what is the recommended statistical response?",
                "Disregarding the anomalies if they comprise under 50% of the dataset.",
                "Manually altering data points to match anticipated policy targets.",
                "Conducting sensitivity analysis, investigating root causes, and applying robust imputation or flagging.",
                "Immediately halting all survey operations and publishing unverified estimates.",
                "C",
                "Anomalies in {keyword} require thorough sensitivity analysis and transparent methodological handling.",
            ),
            (
                "Why is adherence to defined standards in {topic} critical when interpreting {keyword}?",
                "It restricts access strictly to licensed software vendors.",
                "It enforces uniform font styling across national survey documentation.",
                "It eliminates mathematical division operations in summary tables.",
                "It guarantees reproducibility, comparability, and institutional credibility across reporting cycles.",
                "D",
                "Adhering to defined standards for {keyword} guarantees reproducibility and comparability over time.",
            ),
            (
                "What is a primary distinction between robust and non-robust analytical approaches concerning {keyword} in {topic}?",
                "Robust methods remain resilient against extreme outliers and distribution violations.",
                "Non-robust methods can only be computed using manual hand calculations.",
                "Robust methods require zero documentation of source observations.",
                "There is no mathematical difference between robust and non-robust approaches.",
                "A",
                "Robust statistical methods retain valid estimations even in the presence of severe outliers in {keyword}.",
            ),
        ]

        for i in range(count):
            tmpl_idx = i % len(templates)
            q_tmpl, opt_a_tmpl, opt_b_tmpl, opt_c_tmpl, opt_d_tmpl, corr, exp_tmpl = templates[tmpl_idx]

            topic = self.topics[i % len(self.topics)]
            keyword = self.keywords[i % len(self.keywords)]

            if req_diff == "MIXED":
                diff = ["EASY", "MEDIUM", "HARD"][i % 3]
            else:
                diff = req_diff

            q_text = q_tmpl.format(topic=topic, keyword=keyword)
            if i >= len(templates):
                q_text = f"Part {i // len(templates) + 1}: {q_text}"

            questions.append({
                "question_text": q_text,
                "question_type": "MCQ",
                "difficulty": diff,
                "option_a": opt_a_tmpl.format(topic=topic, keyword=keyword),
                "option_b": opt_b_tmpl.format(topic=topic, keyword=keyword),
                "option_c": opt_c_tmpl.format(topic=topic, keyword=keyword),
                "option_d": opt_d_tmpl.format(topic=topic, keyword=keyword),
                "correct_option": corr,
                "explanation": exp_tmpl.format(topic=topic, keyword=keyword),
                "source_reference": f"Source: '{self.material_title}' (Section on {topic})",
            })

        return json.dumps({"questions": questions})


class OpenAILLMProvider:
    """OpenAI API Provider implementation using direct HTTP requests via httpx."""

    def __init__(self, api_key: str, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model or "gpt-4o-mini"
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Invoke OpenAI Chat Completions endpoint."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }

        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(self.endpoint, json=payload, headers=headers)
                if res.status_code != 200:
                    logger.error(f"OpenAI API error ({res.status_code}): {res.text}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"OpenAI generation error: {res.text}",
                    )
                data = res.json()
                return data["choices"][0]["message"]["content"]
        except Exception as exc:
            if isinstance(exc, HTTPException):
                raise
            logger.error(f"Failed to communicate with OpenAI API: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to communicate with LLM provider: {str(exc)}",
            )


class QuestionGenerationService:
    """Service orchestrating AI/Mock question synthesis, response parsing, and database staging."""

    @staticmethod
    def get_provider(material: LearningMaterial, topics: List[str], keywords: List[str]) -> tuple[LLMProvider, str]:
        """Determine whether to use an external LLM Provider or fallback to MockLLMProvider."""
        provider_name = (settings.LLM_PROVIDER or "").lower().strip()
        api_key = (settings.LLM_API_KEY or "").strip()

        if provider_name == "openai" and api_key:
            return OpenAILLMProvider(api_key=api_key, model=settings.LLM_MODEL), "AI"

        logger.info("No active LLM_API_KEY configured; utilizing deterministic MockLLMProvider for assessment generation.")
        return MockLLMProvider(
            material_title=material.title,
            topics=topics,
            keywords=keywords,
        ), "MOCK"

    @classmethod
    def parse_llm_json(cls, raw_content: str) -> List[Dict[str, Any]]:
        """Safely parse JSON output from LLM, stripping markdown wrappers if present."""
        cleaned = raw_content.strip()

        # Strip markdown ```json ... ``` blocks
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict) and "questions" in parsed:
                return parsed["questions"]
            elif isinstance(parsed, list):
                return parsed
            else:
                logger.error(f"Unexpected JSON structure from LLM: {parsed}")
                return []
        except json.JSONDecodeError as exc:
            logger.error(f"JSON decode failure on LLM response: {exc}. Content snippet: {cleaned[:200]}")
            return []

    @classmethod
    def generate_questions_from_content(
        cls,
        db: Session,
        material: LearningMaterial,
        number_of_questions: int,
        difficulty: str,
        question_type: str,
        competency_id: Optional[uuid.UUID],
        language: str,
        current_user: User,
    ) -> Dict[str, Any]:
        """Generate assessment questions from processed learning material content."""
        if material.status != "PROCESSED" or not material.extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Learning material '{material.id}' is not in PROCESSED status.",
            )

        # 1. Content profiling and chunking
        analysis = ContentAnalysisService.analyze_content(material.extracted_text)
        topics = analysis["topics"]
        keywords = analysis["keywords"]
        chunks = ContentAnalysisService.chunk_content_for_generation(material.extracted_text)
        context_excerpt = chunks[0][:3000] if chunks else material.extracted_text[:3000]

        # 2. Select Provider
        provider, generation_mode = cls.get_provider(material, topics, keywords)

        # 3. Construct Prompt
        system_prompt = (
            "You are an expert psychometrician and educational question generator for official statistics and competency evaluation. "
            "Generate questions strictly derived from the provided source context. "
            "Every question must have: question_text, four distinct options (option_a, option_b, option_c, option_d), "
            "a single correct_option ('A', 'B', 'C', or 'D'), an educational explanation, and a source_reference. "
            "Return valid JSON adhering strictly to: {\"questions\": [{\"question_text\": \"...\", \"question_type\": \"MCQ\", "
            "\"difficulty\": \"...\", \"option_a\": \"...\", \"option_b\": \"...\", \"option_c\": \"...\", \"option_d\": \"...\", "
            "\"correct_option\": \"A\", \"explanation\": \"...\", \"source_reference\": \"...\"}]}"
        )

        user_prompt = (
            f"Generate {number_of_questions} questions for competency assessment.\n"
            f"Difficulty: {difficulty}\n"
            f"Question Type: {question_type}\n"
            f"Language: {language}\n"
            f"Source Document Title: {material.title}\n"
            f"Core Topics: {', '.join(topics)}\n\n"
            f"--- Source Context Excerpt ---\n{context_excerpt}\n"
        )

        # 4. Invoke generation
        raw_output = provider.generate(system_prompt, user_prompt)
        raw_questions = cls.parse_llm_json(raw_output)

        if not raw_questions:
            # If provider returned unparseable text, fallback to Mock
            mock_provider = MockLLMProvider(material.title, topics, keywords)
            raw_output = mock_provider.generate(system_prompt, user_prompt)
            raw_questions = cls.parse_llm_json(raw_output)
            generation_mode = "MOCK"

        # 5. Validate & Detect Duplicates
        validated_items: List[GeneratedQuestion] = []
        invalid_count = 0

        duplicate_warnings = QuestionValidationService.detect_duplicates(raw_questions)

        for q_data in raw_questions:
            val_result = QuestionValidationService.validate_generated_question(q_data)
            val_status = "VALID" if val_result["is_valid"] else "INVALID"
            if not val_result["is_valid"]:
                invalid_count += 1

            gen_q = GeneratedQuestion(
                learning_material_id=material.id,
                competency_id=competency_id,
                question_text=q_data.get("question_text", "Untitled Question"),
                question_type=question_type,
                difficulty=q_data.get("difficulty", difficulty if difficulty != "MIXED" else "MEDIUM"),
                option_a=q_data.get("option_a", ""),
                option_b=q_data.get("option_b", ""),
                option_c=q_data.get("option_c", ""),
                option_d=q_data.get("option_d", ""),
                correct_option=str(q_data.get("correct_option", "A")).upper(),
                explanation=q_data.get("explanation"),
                source_reference=q_data.get("source_reference") or f"Source: {material.title}",
                generation_status="GENERATED",
                validation_status=val_status,
                generation_mode=generation_mode,
                created_by=current_user.id,
            )
            db.add(gen_q)
            validated_items.append(gen_q)

        db.commit()
        for item in validated_items:
            db.refresh(item)

        return {
            "material_id": material.id,
            "generation_mode": generation_mode,
            "questions": validated_items,
            "generated_count": len(validated_items),
            "invalid_count": invalid_count,
            "duplicate_warnings": duplicate_warnings,
        }

    @classmethod
    def regenerate_question(
        cls,
        db: Session,
        question_id: uuid.UUID,
        current_user: User,
    ) -> GeneratedQuestion:
        """Regenerate an individual question from its underlying source material without destroying the original record."""
        old_q = db.query(GeneratedQuestion).filter(GeneratedQuestion.id == question_id).first()
        if not old_q:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Generated question '{question_id}' not found.",
            )

        material = old_q.learning_material
        if not material or not material.extracted_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent learning material has no extractable text.",
            )

        analysis = ContentAnalysisService.analyze_content(material.extracted_text)
        provider, generation_mode = cls.get_provider(material, analysis["topics"], analysis["keywords"])

        system_prompt = (
            "Generate exactly ONE multiple choice question adhering to JSON format: "
            "{\"questions\": [{\"question_text\": \"...\", \"question_type\": \"MCQ\", \"difficulty\": \"...\", "
            "\"option_a\": \"...\", \"option_b\": \"...\", \"option_c\": \"...\", \"option_d\": \"...\", "
            "\"correct_option\": \"A\", \"explanation\": \"...\", \"source_reference\": \"...\"}]}"
        )
        user_prompt = (
            f"Generate 1 replacement question.\n"
            f"Difficulty: {old_q.difficulty}\n"
            f"Question Type: {old_q.question_type}\n"
            f"Document Title: {material.title}\n"
            f"Context snippet: {material.extracted_text[:2000]}\n"
        )

        raw_output = provider.generate(system_prompt, user_prompt)
        raw_list = cls.parse_llm_json(raw_output)

        if not raw_list:
            mock_provider = MockLLMProvider(material.title, analysis["topics"], analysis["keywords"])
            raw_output = mock_provider.generate(system_prompt, user_prompt)
            raw_list = cls.parse_llm_json(raw_output)
            generation_mode = "MOCK"

        new_data = raw_list[0] if raw_list else {}
        val_result = QuestionValidationService.validate_generated_question(new_data)

        new_q = GeneratedQuestion(
            learning_material_id=material.id,
            competency_id=old_q.competency_id,
            question_text=new_data.get("question_text", f"Replacement: {old_q.question_text}"),
            question_type=old_q.question_type,
            difficulty=old_q.difficulty,
            option_a=new_data.get("option_a", old_q.option_a),
            option_b=new_data.get("option_b", old_q.option_b),
            option_c=new_data.get("option_c", old_q.option_c),
            option_d=new_data.get("option_d", old_q.option_d),
            correct_option=str(new_data.get("correct_option", old_q.correct_option)).upper(),
            explanation=new_data.get("explanation", old_q.explanation),
            source_reference=new_data.get("source_reference", old_q.source_reference),
            generation_status="GENERATED",
            validation_status="VALID" if val_result["is_valid"] else "INVALID",
            generation_mode=generation_mode,
            created_by=current_user.id,
        )

        db.add(new_q)
        db.commit()
        db.refresh(new_q)
        return new_q
