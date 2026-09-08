"""Content Analysis Service.

Provides deterministic statistical profiling, keyword/topic detection, and document chunking for assessment generation.
"""

import collections
import logging
import re
from typing import Dict, List

logger = logging.getLogger("competiq.services.content_analysis")

COMMON_STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
    "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into",
    "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's",
    "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
    "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't",
    "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
    "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't",
    "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves", "also", "using", "used", "which", "such", "within", "often", "e.g", "i.e", "etc",
}

DOMAIN_TOPICS = [
    "Python", "Data Analysis", "SQL", "Pandas", "NumPy", "Statistics",
    "Sampling", "Survey Design", "Probability Sampling", "Data Quality",
    "Data Visualization", "GIS", "Machine Learning", "Artificial Intelligence",
    "Cybersecurity", "Data Privacy", "Digital Governance", "National Accounts",
    "Price Statistics", "Labour Statistics", "Linear Regression", "Hypothesis Testing",
]


class ContentAnalysisService:
    """Service providing heuristic profiling, keyword extraction, and document chunking."""

    @staticmethod
    def calculate_content_statistics(text: str) -> Dict[str, int]:
        """Calculate word count, character count, and estimated reading time."""
        char_count = len(text)
        words = text.split()
        word_count = len(words)
        # Average adult reading speed ~200 words per minute
        reading_minutes = max(1, round(word_count / 200)) if word_count > 0 else 0

        return {
            "character_count": char_count,
            "word_count": word_count,
            "estimated_reading_minutes": reading_minutes,
        }

    @staticmethod
    def extract_keywords(text: str, top_n: int = 10) -> List[str]:
        """Extract top frequent informative keywords using frequency analysis and stopword filtering."""
        words = re.findall(r"\b[A-Za-z]{3,}\b", text.lower())
        meaningful_words = [w for w in words if w not in COMMON_STOPWORDS]

        counts = collections.Counter(meaningful_words)
        top_words = [word for word, _ in counts.most_common(top_n)]
        return top_words

    @staticmethod
    def identify_topics(text: str, top_n: int = 6) -> List[str]:
        """Identify primary topics using domain terminology recognition and prominent headings."""
        detected = []

        # 1. Match known domain topics (case-insensitive)
        text_lower = text.lower()
        for topic in DOMAIN_TOPICS:
            if topic.lower() in text_lower:
                detected.append(topic)

        # 2. Extract potential topics from title/heading lines (# Heading or lines <= 60 chars ending in colon/newline)
        heading_candidates = re.findall(r"(?:^|\n)(?:#+\s*([A-Za-z0-9\s]{3,50})|([A-Z][A-Za-z0-9\s]{3,40}):)", text)
        for h1, h2 in heading_candidates:
            h = (h1 or h2).strip()
            if h and len(h) > 3 and h not in detected and h.lower() not in COMMON_STOPWORDS:
                detected.append(h)

        # Return top N detected topics
        return detected[:top_n] if detected else ["General Education", "Core Principles"]

    @classmethod
    def analyze_content(cls, text: str) -> Dict[str, any]:
        """Run complete statistical and thematic content analysis."""
        stats = cls.calculate_content_statistics(text)
        keywords = cls.extract_keywords(text, top_n=10)
        topics = cls.identify_topics(text, top_n=6)

        return {
            "character_count": stats["character_count"],
            "word_count": stats["word_count"],
            "estimated_reading_minutes": stats["estimated_reading_minutes"],
            "topics": topics,
            "keywords": keywords,
        }

    @staticmethod
    def chunk_content_for_generation(text: str, max_chunk_chars: int = 3500) -> List[str]:
        """Divide long document content into paragraph-aware chunks for LLM consumption.

        Avoids splitting sentences mid-way and preserves contextual boundaries.
        """
        if not text or len(text) <= max_chunk_chars:
            return [text] if text else []

        paragraphs = text.split("\n\n")
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_len = len(para)

            # If single paragraph exceeds max_chunk_chars, split on sentence boundaries
            if para_len > max_chunk_chars:
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_length = 0

                sentences = re.split(r"(?<=[.!?])\s+", para)
                sub_chunk: List[str] = []
                sub_len = 0
                for sent in sentences:
                    if sub_len + len(sent) > max_chunk_chars and sub_chunk:
                        chunks.append(" ".join(sub_chunk))
                        sub_chunk = [sent]
                        sub_len = len(sent)
                    else:
                        sub_chunk.append(sent)
                        sub_len += len(sent)
                if sub_chunk:
                    chunks.append(" ".join(sub_chunk))
                continue

            # Standard paragraph accumulation
            if current_length + para_len + 2 > max_chunk_chars and current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = [para]
                current_length = para_len
            else:
                current_chunk.append(para)
                current_length += para_len + 2

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return chunks
