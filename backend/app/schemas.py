from pydantic import BaseModel
from typing import List, Optional

class SessionSchema(BaseModel):
    id: str
    name: str
    muscle_groups: List[str]

class SplitTemplateCreate(BaseModel):
    name: str
    sessions: List[SessionSchema]

class SplitTemplateOut(BaseModel):
    id: str
    name: str
    sessions: List[SessionSchema]

class DailyLogCreate(BaseModel):
    date: date
    trained: bool
    split_template_id: Optional[str]
    total_sets: int
    failure_sets: int
    total_rir: int
    # other fields add later if needed