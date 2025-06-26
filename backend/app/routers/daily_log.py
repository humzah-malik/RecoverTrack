from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
import pandas as pd

from app.database import SessionLocal
from app.models import DailyLog
from app.schemas import DailyLogCreate, DailyLogOut
from app.routers.auth import get_current_user

router = APIRouter(tags=["daily-log"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/daily-log", response_model=DailyLogOut, status_code=201)
def upsert_daily_log(
    payload: DailyLogCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # upsert by date
    obj = (
        db.query(DailyLog)
        .filter_by(user_id=current_user.id, date=payload.date)
        .first()
    )
    if obj:
        for k,v in payload.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
    else:
        obj = DailyLog(user_id=current_user.id, **payload.model_dump())
        db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/daily-log", response_model=DailyLogOut)
def get_daily_log(
    date: date = Query(..., description="YYYY-MM-DD"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    obj = (
        db.query(DailyLog)
        .filter_by(user_id=current_user.id, date=date)
        .first()
    )
    if not obj:
        raise HTTPException(404, "Log not found")
    return obj

@router.get("/daily-log/history", response_model=list[DailyLogOut])
def get_history(
    days: int = Query(7, ge=1, le=30),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow().date() - timedelta(days=days-1)
    logs = (
        db.query(DailyLog)
        .filter(
            DailyLog.user_id == current_user.id,
            DailyLog.date >= cutoff
        )
        .order_by(DailyLog.date.desc())
        .all()
    )
    return logs