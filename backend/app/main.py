# backend/app/main.py
from dotenv import load_dotenv
import os
from fastapi import FastAPI
from app.models import SplitTemplate, SplitSession, Base
from app.routers import user, auth, daily_log, splits, rules_templates, recovery
from app.database import engine, SessionLocal
from app.routers.analytics import router as analytics_router
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
    # production URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

PRESETS = [
    {
        "name": "Push/Pull/Legs",
        "type": "strength",
        "sessions": [
            {"name":"Push", "muscle_groups":["Chest","Shoulders","Triceps"]},
            {"name":"Pull", "muscle_groups":["Back","Biceps", "Forearms"]},
            {"name":"Legs", "muscle_groups":["Quads","Glutes","Hamstrings"]}
        ]
    },
    {
        "name": "Upper/Lower",
        "type": "strength",
        "sessions": [
            {"name":"Upper", "muscle_groups":["Chest","Back","Shoulders","Arms"]},
            {"name":"Lower", "muscle_groups":["Quads","Hamstrings","Glutes","Calves"]}
        ]
    },
    {
        "name": "Full-Body",
        "type": "strength",
        "sessions": [
            {"name":"Full Body", "muscle_groups":["Chest","Back","Legs","Arms","Shoulders"]}
        ]
    },
    {
        "name": "3×/week Run",
        "type": "cardio",
        "sessions": [
            {"name":"Run", "muscle_groups":["Cardio"]},
            {"name":"Run", "muscle_groups":["Cardio"]},
            {"name":"Run", "muscle_groups":["Cardio"]}
        ]
    },
    {
        "name": "Walk/HIIT Hybrid",
        "type": "cardio",
        "sessions": [
            {"name":"Walk","muscle_groups":["Cardio"]},
            {"name":"HIIT","muscle_groups":["Cardio"]},
            {"name":"Walk","muscle_groups":["Cardio"]},
            {"name":"HIIT","muscle_groups":["Cardio"]}
        ]
    },
    {
        "name": "Cycling Focus",
        "type": "cardio",
        "sessions": [
            {"name":"Cycle","muscle_groups":["Cardio"]},
            {"name":"Cycle","muscle_groups":["Cardio"]},
            {"name":"Cycle","muscle_groups":["Cardio"]}
        ]
    },
    {
        "name": "Strength + Cardio Mix",
        "type": "mixed",
        "sessions": [
            {"name":"Upper","muscle_groups":["Chest","Back","Shoulders"]},
            {"name":"Cycle","muscle_groups":["Cardio"]},
            {"name":"Lower","muscle_groups":["Quads","Hamstrings","Glutes"]},
            {"name":"Run","muscle_groups":["Cardio"]}
        ]
    },
    {
        "name": "Push/Pull Variant",
        "type": "strength",
        "sessions": [
            {"name":"Chest & Biceps", "muscle_groups":["Chest", "Biceps"]},
            {"name":"Back & Triceps", "muscle_groups":["Back", "Triceps"]},
            {"name":"Legs & Shoulders", "muscle_groups":["Quads", "Hamstrings", "Glutes", "Shoulders"]}
        ]
    },
    {
        "name": "Arnold Split",
        "type": "strength",
        "sessions": [
            {"name":"Chest & Back 1", "muscle_groups":["Chest", "Back"]},
            {"name":"Shoulders & Arms 1", "muscle_groups":["Shoulders", "Biceps", "Triceps"]},
            {"name":"Legs 1", "muscle_groups":["Quads", "Hamstrings", "Glutes", "Calves"]},
            {"name":"Chest & Back 2", "muscle_groups":["Chest", "Back"]},
            {"name":"Shoulders & Arms 2", "muscle_groups":["Shoulders", "Biceps", "Triceps"]},
            {"name":"Legs 2", "muscle_groups":["Quads", "Hamstrings", "Glutes", "Calves"]}
        ]
    },
    {
        "name": "Bro Split",
        "type": "strength",
        "sessions": [
            {"name":"Chest", "muscle_groups":["Chest"]},
            {"name":"Back", "muscle_groups":["Back"]},
            {"name":"Legs", "muscle_groups":["Quads", "Hamstrings", "Glutes", "Calves"]},
            {"name":"Arms", "muscle_groups":["Biceps", "Triceps"]},
            {"name":"Shoulders", "muscle_groups":["Shoulders"]}
        ]
    }
]

def seed_presets():
    db = SessionLocal()
    existing = db.query(SplitTemplate).filter_by(is_preset=1).count()
    if existing == 0:
        for preset in PRESETS:
            tpl = SplitTemplate(
                name=preset["name"],
                type=preset["type"],
                is_preset=1,
                created_at=datetime.utcnow()
            )
            db.add(tpl); db.flush()
            for s in preset["sessions"]:
                db.add(SplitSession(
                    template_id=tpl.id,
                    name=s["name"],
                    muscle_groups=s["muscle_groups"]
                ))
        db.commit()
    db.close()

seed_presets()

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(daily_log.router)
app.include_router(splits.router)
app.include_router(rules_templates.router)
app.include_router(analytics_router)
app.include_router(recovery.router)