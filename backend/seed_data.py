# backend/seed_data.py

from datetime import date, timedelta
from app.models import Base, User, DailyLog
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Connect
engine = create_engine(os.getenv("DATABASE_URL"), echo=True)
Session = sessionmaker(bind=engine)

def seed():
    Base.metadata.create_all(engine)  # ensures tables exist

    session = Session()
    # 1) Create dummy user
    user = User(
        email="testuser@example.com",
        age=25,
        sex="other",
        height=175.0,
        weight=70.0,
        goal="bulking",
        split_template="Upper/Lower",
        maintenance_calories=2500,
        macro_targets={"protein":150, "carbs":250, "fat":70},
    )
    session.add(user)
    session.commit()  # need ID for foreign keys

    # 2) Create 3 days of logs
    for i in range(3):
        log = DailyLog(
            user_id=user.id,
            date=date.today() - timedelta(days=i),
            trained=1 if i % 2 == 0 else 0,
            split="Upper" if i % 2 == 0 else None,
            total_sets=12 if i % 2 == 0 else 0,
            failure_sets=2 if i % 2 == 0 else 0,
            total_rir=20 if i % 2 == 0 else 0,
            sleep_start="23:00",
            sleep_end="07:00",
            sleep_quality=4,
            resting_hr=60,
            hrv=45.5,
            soreness={"Upper":"Low", "Lower":"High"} if i % 2 == 0 else {"Upper":"Med"},
            calories=2600,
            macros={"protein":140, "carbs":260, "fat":80},
            stress=3,
            motivation=8,
        )
        session.add(log)

    session.commit()
    session.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed()