# scripts/extract_recovery_dataset.py
import sys
from pathlib import Path

# allow imports from project root
sys.path.append(str(Path(__file__).resolve().parents[1]))

import csv
import json
from datetime import date, timedelta
from app.database import SessionLocal
from app.models import User, DailyLog, SplitSession
from app.utils.context import build_daily_context

def main():
    db = SessionLocal()
    users = db.query(User).all()

    fieldnames = [
        'user_id', 'date',
        'sleep_h', 'sleep_quality', 'resting_hr', 'hrv',
        'trained', 'total_sets', 'failure_sets', 'total_rir',
        'cal_deficit_pct', 'protein_pct', 'carbs_pct', 'fat_pct',
        'stress', 'motivation', 'water_intake_l',
        'split_type', 'muscle_groups',
        'age', 'sex', 'height', 'weight', 'goal', 'activity_level',
        'recovery_rating'
    ]

    with open('recovery_dataset.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for u in users:
            for offset in range(180):
                day = date.today() - timedelta(days=offset)

                # derived features
                ctx = build_daily_context(u, day, db)

                # raw log
                log = (
                    db.query(DailyLog)
                      .filter_by(user_id=u.id, date=day)
                      .first()
                )

                # split_type from the template itself
                split_type = None
                muscle_groups = None
                if log and log.split and log.split_template_id:
                    # find the session record by name
                    sess = (
                        db.query(SplitSession)
                          .filter_by(template_id=log.split_template_id,
                                     name=log.split)
                          .first()
                    )
                    if sess:
                        muscle_groups = json.dumps(sess.muscle_groups)
                    # split_type comes from the template (relationship)
                    split_type = getattr(log.split_template, 'type', None)

                row = {
                    'user_id': u.id,
                    'date': day.isoformat(),
                    # derived features
                    'sleep_h':           ctx.get('sleep_h'),
                    'sleep_quality':     ctx.get('sleep_quality'),
                    'resting_hr':        ctx.get('resting_hr'),
                    'hrv':               ctx.get('hrv'),
                    'trained':           ctx.get('trained'),
                    'total_sets':        ctx.get('total_sets'),
                    'failure_sets':      ctx.get('failure_sets'),
                    'total_rir':         ctx.get('total_rir'),
                    'cal_deficit_pct':   ctx.get('cal_deficit_pct'),
                    'protein_pct':       ctx.get('protein_pct'),
                    'carbs_pct':         ctx.get('carbs_pct'),
                    'fat_pct':           ctx.get('fat_pct'),
                    'stress':            ctx.get('stress'),
                    'motivation':        ctx.get('motivation'),
                    'water_intake_l':    ctx.get('water_intake_l'),
                    # split info
                    'split_type':        split_type,
                    'muscle_groups':     muscle_groups,
                    # static user fields
                    'age':               u.age,
                    'sex':               u.sex,
                    'height':            u.height,
                    'weight':            u.weight,
                    'goal':              u.goal,
                    'activity_level':    u.activity_level,
                    # label
                    'recovery_rating':   (log.recovery_rating if log else None),
                }

                writer.writerow(row)

    db.close()


if __name__ == '__main__':
    main()