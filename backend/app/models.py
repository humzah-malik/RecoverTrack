# backend/app/models.py

from sqlalchemy import (
    Column, String, Integer, Float, Date, JSON, DateTime, Boolean, ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime
import uuid
from passlib.context import CryptContext
from sqlalchemy.dialects.postgresql import UUID

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base = declarative_base()

def gen_uuid():
    return str(uuid.uuid4())

class SplitTemplate(Base):
    __tablename__ = "split_templates"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False, default="strength")  # 'strength' | 'cardio' | 'mixed'
    is_preset = Column(Integer, default=0)   # 1=preset (built in), 0=custom
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("SplitSession", back_populates="template", cascade="all, delete-orphan")

class SplitSession(Base):
    __tablename__ = "split_sessions"
    id = Column(String, primary_key=True, default=gen_uuid)
    template_id = Column(String, ForeignKey("split_templates.id"), nullable=False)
    name = Column(String(100), nullable=False)         # e.g. "Push"
    muscle_groups = Column(JSON, nullable=False)       # e.g. ["Chest","Shoulders","Triceps"]

    template = relationship("SplitTemplate", back_populates="sessions")
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    age = Column(Integer)
    sex = Column(String(10))
    height = Column(Float)
    height_unit = Column(String(5), default="cm")
    weight = Column(Float, nullable=True)
    weight_unit = Column(String(5), default="kg")
    goal = Column(String(20))    # 'cutting','bulking','performance','maintenance'
    # split_template = Column(String(50))   # e.g. 'Upper/Lower'
    split_template_id = Column(String, ForeignKey("split_templates.id"), nullable=True)
    maintenance_calories = Column(Integer)
    macro_targets = Column(JSON)  # {'protein':g, 'carbs':g, 'fat':g}
    activity_level = Column(String(10), nullable=True)
    weight_target = Column(Float, nullable=True)
    weight_target_unit = Column(String(5), default="kg")
    auto_nutrition = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    def verify_password(self, plain: str) -> bool:
        return pwd_context.verify(plain, self.password_hash)
    
class UserSplitTemplate(Base):
    __tablename__ = "user_split_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(String, ForeignKey("split_templates.id", ondelete="CASCADE"), nullable=False)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DailyLog(Base):
    __tablename__ = "daily_logs"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False)
    date = Column(Date, default=datetime.utcnow().date)
    trained = Column(Integer, default=0) # 0 = rest, 1 = trained
    split = Column(String(50), nullable=True)
    total_sets = Column(Integer, default=0)
    failure_sets = Column(Integer, default=0)
    total_rir = Column(Integer, default=0)
    sleep_start = Column(String(5), nullable=True)
    sleep_end = Column(String(5), nullable=True)
    sleep_quality = Column(Integer, nullable=True)
    resting_hr = Column(Integer, nullable=True)
    hrv = Column(Float, nullable=True)
    soreness = Column(JSON, nullable=True)  # {'Quads':'High',etc}
    calories = Column(Integer, nullable=True)
    macros = Column(JSON, nullable=True)    # {'protein':g,'carbs':g,'fat':g}
    stress = Column(Integer, nullable=True)
    motivation = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    split_template_id = Column(
        String, ForeignKey("split_templates.id"), nullable=True
    )
    split_template = relationship("SplitTemplate")


class RuleTemplate(Base):
    __tablename__  = "rule_templates"
    id             = Column(String, primary_key=True)
    description    = Column(String, nullable=False)
    conditions     = Column(JSON, nullable=False)   # JSON array of {field,operator,value}
    advice         = Column(String, nullable=False)
    for_goals      = Column(ARRAY(String), nullable=True)    # NULL or e.g. ["cutting","bulking"]
    timeframe      = Column(String, nullable=False) # "daily" | "weekly" | "monthly"

class DailyDigest(Base):
    __tablename__ = "daily_digests"
    user_id       = Column(String, ForeignKey("users.id"), primary_key=True)
    date          = Column(Date, primary_key=True)
    alerts        = Column(JSON, nullable=False)   # list of advice strings
    micro_tips    = Column(JSON, nullable=False)   # list of tip strings
    created_at    = Column(DateTime, default=datetime.utcnow)