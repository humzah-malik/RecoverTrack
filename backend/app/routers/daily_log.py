from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List
import pandas as pd
from io import BytesIO

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
    data = payload.model_dump(exclude_unset=True)
    # makes sure trained lands in the int4 column
    if "trained" in data:
        data["trained"] = 1 if data["trained"] else 0

    # upserts by (user_id, date)
    obj = (
        db.query(DailyLog)
          .filter_by(user_id=current_user.id, date=payload.date)
          .first()
    )
    if obj:
        for k, v in data.items():
            setattr(obj, k, v)
    else:
        obj = DailyLog(user_id=current_user.id, **data)
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

@router.post("/daily-log/bulk-import", status_code=201)
def bulk_import_logs(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        content = file.file.read()
        if file.filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        df.fillna(value=pd.NA, inplace=True)

        for _, row in df.iterrows():
            try:
                date_value = pd.to_datetime(row["date"]).date()
                trained = bool(row.get("trained", False))

                log_data = {
                    "date": date_value,
                    "trained": trained,
                    "sleep_start": row.get("sleep_start"),
                    "sleep_end": row.get("sleep_end"),
                    "sleep_quality": row.get("sleep_quality"),
                    "resting_hr": row.get("resting_hr"),
                    "hrv": row.get("hrv"),
                    "soreness": eval(row.get("soreness")) if row.get("soreness") else None,
                    "stress": row.get("stress"),
                    "motivation": row.get("motivation"),
                    "total_sets": row.get("total_sets"),
                    "failure_sets": row.get("failure_sets"),
                    "total_rir": row.get("total_rir"),
                    "calories": row.get("calories"),
                    "macros": eval(row.get("macros")) if row.get("macros") else None,
                    "split": row.get("split"),
                    "workout": row.get("workout")
                }

                obj = (
                    db.query(DailyLog)
                      .filter_by(user_id=current_user.id, date=date_value)
                      .first()
                )
                if obj:
                    for k, v in log_data.items():
                        setattr(obj, k, v)
                else:
                    new_log = DailyLog(user_id=current_user.id, **log_data)
                    db.add(new_log)

            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing row: {e}")

        db.commit()
        return {"message": "Bulk import successful"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk import failed: {e}")