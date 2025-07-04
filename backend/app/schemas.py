# backend/app/schemas.py
from pydantic import BaseModel, ConfigDict, field_validator, model_validator, ValidationError
from typing import List, Optional, Dict, Any
from datetime import date

class SessionSchema(BaseModel):
    id: str
    name: str
    muscle_groups: List[str]

    model_config = ConfigDict(from_attributes=True)

class SplitTemplateCreate(BaseModel):
    name: str
    type: str # 'strength'|'cardio'|'mixed'
    sessions: List[SessionSchema]

class SplitTemplateOut(BaseModel):
    id: str
    name: str
    type: str
    is_preset: int
    sessions: List[SessionSchema]

    model_config = ConfigDict(from_attributes=True)

class DailyLogBase(BaseModel):
    date: date
    trained: Optional[bool] = None
    # which session from the split template (inferred if trained)
    split: Optional[str] = None
    split_template_id: Optional[str] = None

    # recovery (pre-workout) fields
    sleep_start: Optional[str] = None # "23:30"
    sleep_end: Optional[str] = None  # "06:30"
    sleep_quality: Optional[int] = None # 1–5
    resting_hr: Optional[int] = None
    hrv: Optional[float] = None
    soreness: Optional[int] = None  # 1–5 overall muscle soreness
    stress: Optional[int] = None  # 1–5
    motivation: Optional[int] = None # 1–5

    # post-workout fields
    total_sets: Optional[int] = None
    failure_sets: Optional[int] = None
    total_rir: Optional[int] = None
    calories: Optional[int] = None
    macros: Optional[Dict[str, int]] = None # {"protein":160,…}
    weight: Optional[float] = None
    weight_unit: Optional[str]  = "lb"  # "kg"|"lb"
    recovery_rating: Optional[int] = None  # 0–100
    water_intake_l: Optional[float] = None # litres

    @field_validator("soreness")
    def validate_soreness_range(cls, v):
        if v is not None and not (1 <= v <= 5):
            raise ValueError("`soreness` must be between 1 and 5")
        return v

    @field_validator("recovery_rating")
    def validate_recovery_range(cls, v):
        if v is not None and not (0 <= v <= 100):
            raise ValueError("`recovery_rating` must be between 0 and 100")
        return v

    @field_validator("water_intake_l")
    def validate_water_nonnegative(cls, v):
        if v is not None and v < 0:
            raise ValueError("`water_intake_l` must be non-negative")
        return v

    @model_validator(mode="before")
    def check_workout_fields(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        # only validate on raw dict input
        if not isinstance(values, dict):
            return values

        trained = values.get("trained")
        # always require date
        if values.get("date") is None:
            raise ValueError("`date` is required")
        # if they say yes, enforce post-workout fields
        if trained:
            missing = [f for f in ("total_sets","failure_sets","total_rir") 
                       if values.get(f) is None]
            if missing:
                raise ValueError(f"On trained days, missing {missing}")
        return values

class DailyLogCreate(DailyLogBase):
    pass


class DailyLogOut(DailyLogBase):
    id: str
    user_id: str

    # which session from the split template (inferred if trained)
    split: Optional[str] = None

    class Config:
        from_attributes = True

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
    height_unit: Optional[str]
    weight_unit: Optional[str]
    goal: Optional[str]
    maintenance_calories: Optional[int]
    macro_targets: Optional[dict]
    activity_level: Optional[str]
    weight_target: Optional[float]
    weight_target_unit: Optional[str]
    split_template_id: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    age: Optional[int] = None
    sex: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    height_unit: Optional[str] = None
    weight_unit: Optional[str] = None
    goal: Optional[str] = None
    maintenance_calories: Optional[int] = None
    macro_targets: Optional[dict] = None
    activity_level: Optional[str] = None
    weight_target: Optional[float] = None
    weight_target_unit: Optional[str] = None
    split_template_id: Optional[str] = None

    @field_validator('age')
    def validate_age(cls, v):
        if v is not None and not (10 <= v <= 120):
            raise ValueError('Age must be between 10 and 120')
        return v

    @model_validator(mode="before")
    def validate_units(cls, values):
        height = values.get("height")
        height_unit = values.get("height_unit")
        if height is not None and height_unit:
            if height_unit == "cm" and not (100 <= height <= 250):
                raise ValueError("Height in cm must be between 100 and 250")
            elif height_unit == "in" and not (39 <= height <= 98):
                raise ValueError("Height in inches must be between 39 and 98")

        weight = values.get("weight")
        weight_unit = values.get("weight_unit")
        if weight is not None and weight_unit:
            if weight_unit == "kg" and not (30 <= weight <= 250):
                raise ValueError("Weight in kg must be between 30 and 250")
            elif weight_unit == "lb" and not (66 <= weight <= 550):
                raise ValueError("Weight in lb must be between 66 and 550")

        return values
    
# ── Rule Templates ────────────────────────────────────────────────────────────

class RuleTemplateBase(BaseModel):
    id: str
    description: str
    conditions: List[Dict]           # e.g. [{"field":"sleep_h","operator":"<","value":6}]
    advice: str
    for_goals: Optional[List[str]]   # e.g. ["cutting","maintenance"]
    timeframe: str                   # "daily" | "weekly" | "monthly"

class RuleTemplateCreate(RuleTemplateBase):
    pass

class RuleTemplateUpdate(BaseModel):
    description: Optional[str]
    conditions:  Optional[List[Dict]]
    advice:      Optional[str]
    for_goals:   Optional[List[str]]
    timeframe:   Optional[str]

class RuleTemplateOut(RuleTemplateBase):
    class Config:
        from_attributes = True

# ── Daily Digest ─────────────────────────────────────────────────────────────

class DailyDigestOut(BaseModel):
    user_id: str
    date: date
    alerts: List[str]
    micro_tips: List[str]
    class Config:
        from_attributes = True


class RecoveryPredictRequest(BaseModel):
    user_id: str
    date: Optional[date] = None   # YYYY-MM-DD; if omitted, use today()

class RecoveryPredictResponse(BaseModel):
    predicted_recovery_rating: float

    model_config = ConfigDict(from_attributes=True)