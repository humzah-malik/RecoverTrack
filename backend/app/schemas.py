# backend/app/schemas.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date

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

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str

class UserOut(BaseModel):
    id: str
    email: str
    age: Optional[int]
    sex: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    goal: Optional[str]
    maintenance_calories: Optional[int]
    macro_targets: Optional[dict]
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    age: Optional[int]
    sex: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    height_unit: Optional[str] = None
    weight_unit: Optional[str] = None
    goal: Optional[str]
    maintenance_calories: Optional[int]
    macro_targets: Optional[dict]