# backend/app/main.py
from dotenv import load_dotenv
import os
from fastapi import FastAPI
from app.routers import user, auth, daily_log
from app.database import engine, SessionLocal

load_dotenv()


app = FastAPI()

@app.get("/health")
def health():
    return {
      "supabase_url": os.getenv("SUPABASE_URL"),
      "database_url": os.getenv("DATABASE_URL")[:30] + "…"
    }

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(daily_log.router)