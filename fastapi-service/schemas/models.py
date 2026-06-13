from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class EmbedRequest(BaseModel):
    user_id: str
    profile_text: str

class RecommendFilters(BaseModel):
    skills: Optional[List[str]] = None
    roles: Optional[List[str]] = None
    location: Optional[str] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None

class RecommendRequest(BaseModel):
    user_id: str
    filters: Optional[RecommendFilters] = None
    limit: Optional[int] = 20
    exclude_ids: Optional[List[str]] = Field(default_factory=list)

class UpdatePreferenceRequest(BaseModel):
    user_id: str
    target_user_id: str
    direction: str  # "RIGHT" or "LEFT"

class ChatMessage(BaseModel):
    role: str  # "user", "model", or "system"
    content: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)

class ValidateTagRequest(BaseModel):
    value: str
    kind: str  # "skill" or "role"
