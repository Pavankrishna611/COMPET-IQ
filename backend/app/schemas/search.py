"""Search request and response schemas."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class SearchResultItem(BaseModel):
    """Single search result entry with routing and relevance metadata."""

    id: str
    title: str
    subtitle: Optional[str] = None
    category: str = Field(
        ...,
        description="Internal category identifier: course, competency, assessment, learning_path, material",
    )
    category_label: str = Field(
        ...,
        description="Display label: Course, Competency, Assessment, Learning Path, Resource",
    )
    description: Optional[str] = None
    badge: Optional[str] = None
    url: str
    score: float = 0.0


class SearchResponse(BaseModel):
    """Unified search response model."""

    query: str
    total_results: int
    results: List[SearchResultItem]
    category_counts: Dict[str, int]
