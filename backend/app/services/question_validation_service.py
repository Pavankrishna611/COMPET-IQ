"""Question Validation and Duplicate Detection Service."""

import difflib
import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger("competiq.services.question_validation")


class QuestionValidationService:
    """Service evaluating generated question correctness, formatting compliance, and redundancy."""

    @classmethod
    def validate_generated_question(cls, q: Dict[str, Any]) -> Dict[str, Any]:
        """Validate question structure against strict educational authoring rules.

        Returns a dict containing validation status ('VALID' or 'INVALID') and error details.
        """
        errors: List[str] = []

        # 1. Question text validity
        text = str(q.get("question_text") or "").strip()
        if not text:
            errors.append("Question text is empty.")
        elif len(text) < 10:
            errors.append("Question text is too short (minimum 10 characters required).")

        # 2. Four distinct non-empty options
        opts = {
            "A": str(q.get("option_a") or "").strip(),
            "B": str(q.get("option_b") or "").strip(),
            "C": str(q.get("option_c") or "").strip(),
            "D": str(q.get("option_d") or "").strip(),
        }

        for letter, opt_val in opts.items():
            if not opt_val:
                errors.append(f"Option {letter} is empty.")

        # Check for duplicate options
        non_empty_opts = [v.lower() for v in opts.values() if v]
        if len(non_empty_opts) != len(set(non_empty_opts)):
            errors.append("Multiple options contain duplicate or identical text.")

        # 3. Correct option verification
        corr = str(q.get("correct_option") or "").strip().upper()
        if corr not in {"A", "B", "C", "D"}:
            errors.append(f"Invalid correct_option '{corr}'. Must be A, B, C, or D.")
        elif not opts.get(corr):
            errors.append(f"Correct option '{corr}' points to an empty option.")

        # 4. Explanation requirement
        explanation = str(q.get("explanation") or "").strip()
        if not explanation:
            errors.append("Educational explanation is missing.")
        elif len(explanation) < 5:
            errors.append("Explanation is too brief (minimum 5 characters required).")

        is_valid = len(errors) == 0
        return {
            "is_valid": is_valid,
            "status": "VALID" if is_valid else "INVALID",
            "errors": errors,
        }

    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize string for fuzzy similarity comparison."""
        cleaned = re.sub(r"[^\w\s]", "", text.lower())
        return re.sub(r"\s+", " ", cleaned).strip()

    @classmethod
    def detect_duplicates(cls, questions: List[Dict[str, Any]], threshold: float = 0.85) -> List[str]:
        """Detect near-duplicate question statements using difflib SequenceMatcher.

        Returns list of human-readable duplicate warning messages without modifying original records.
        """
        warnings: List[str] = []
        n = len(questions)
        if n < 2:
            return warnings

        normalized = [cls.normalize_text(q.get("question_text", "")) for q in questions]

        for i in range(n):
            for j in range(i + 1, n):
                t1, t2 = normalized[i], normalized[j]
                if not t1 or not t2:
                    continue

                matcher = difflib.SequenceMatcher(None, t1, t2)
                ratio = matcher.ratio()

                if ratio >= threshold:
                    warning_msg = (
                        f"Potential redundancy: Question {i + 1} and Question {j + 1} "
                        f"have {round(ratio * 100)}% textual similarity."
                    )
                    warnings.append(warning_msg)
                    logger.warning(warning_msg)

        return warnings
