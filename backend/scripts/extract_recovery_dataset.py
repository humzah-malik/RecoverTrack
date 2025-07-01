# scripts/extract_recovery_dataset.py
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import csv
from datetime import date, timedelta
from app.database import SessionLocal
from app.models import User, DailyLog
from app.utils.context import build_daily_context

def main():
    db = SessionLocal()
    users = db.query(User).all()
    fieldnames = [
      'user_id','date',
      'sleep_h','sleep_quality','resting_hr','hrv',
      'trained','total_sets','failure_sets','total_rir',
      'cal_deficit_pct','protein_pct','carbs_pct','fat_pct',
      'stress','motivation','water_intake_l',
      'age','sex','height','weight','goal','activity_level',
      'recovery_rating'
    ]

    with open('recovery_dataset.csv','w',newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for u in users:
            # assume we have logs for the last 180 days
            for offset in range(180):
                day = date.today() - timedelta(days=offset)
                ctx = build_daily_context(u, day, db)
                log = db.query(DailyLog).filter_by(user_id=u.id, date=day).first()
                row = {
                  **{k: ctx[k] for k in fieldnames if k in ctx},
                  'user_id': u.id,
                  'date': day.isoformat(),
                  # static user fields
                  'age': u.age,
                  'sex': u.sex,
                  'height': u.height,
                  'weight': u.weight,
                  'goal': u.goal,
                  'activity_level': u.activity_level,
                  'recovery_rating': log.recovery_rating if log else None,
                }
                writer.writerow(row)

    db.close()

if __name__ == '__main__':
    main()