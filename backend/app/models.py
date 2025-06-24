# backend/app/models.py

from sqlalchemy import (
    Column, String, Integer, Float, Date, JSON, DateTime
)
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False)
    age = Column(Integer)
    sex = Column(String(10))
    height = Column(Float)
    weight = Column(Float)
    goal = Column(String(20))             # 'cutting','bulking','performance','maintenance'
    split_template = Column(String(50))   # e.g. 'Upper/Lower'
    maintenance_calories = Column(Integer)
    macro_targets = Column(JSON)          # {'protein':g, 'carbs':g, 'fat':g}
    created_at = Column(DateTime, default=datetime.utcnow)

class DailyLog(Base):
    __tablename__ = "daily_logs"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False)
    date = Column(Date, default=datetime.utcnow().date)
    trained = Column(Integer, default=0)              # 0 = rest, 1 = trained
    split = Column(String(50), nullable=True)
    total_sets = Column(Integer, default=0)
    failure_sets = Column(Integer, default=0)
    total_rir = Column(Integer, default=0)
    sleep_start = Column(String(5), nullable=True)
    sleep_end = Column(String(5), nullable=True)
    sleep_quality = Column(Integer, nullable=True)
    resting_hr = Column(Integer, nullable=True)
    hrv = Column(Float, nullable=True)
    soreness = Column(JSON, nullable=True)  # e.g. {'Quads':'High',...}
    calories = Column(Integer, nullable=True)
    macros = Column(JSON, nullable=True)    # {'protein':g,'carbs':g,'fat':g}
    stress = Column(Integer, nullable=True)
    motivation = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)