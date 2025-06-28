from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from app.database import SessionLocal
from app.models import User
from app.routers.auth import get_current_user
from app.utils.context import build_daily_context, build_weekly_context, build_monthly_context
from app.utils.rules import evaluate_rules_from_context
from app.utils.digests import compute_daily_micro_tips

router = APIRouter(prefix="/analytics", tags=["analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/daily")
def daily_insights(
    day: date = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx    = build_daily_context(current_user, day, db)
    alerts = evaluate_rules_from_context(ctx, "daily", current_user, db)
    return {"date": day, "context": ctx, "alerts": alerts}

@router.get("/weekly")
def weekly_insights(
    end_date: date = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx    = build_weekly_context(current_user, end_date, db)
    alerts = evaluate_rules_from_context(ctx, "weekly", current_user, db)
    return {"end_date": end_date, "context": ctx, "alerts": alerts}

@router.get("/monthly")
def monthly_insights(
    month: str = Query(..., regex=r"^\d{4}-\d{2}$", description="YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx    = build_monthly_context(current_user, month, db)
    alerts = evaluate_rules_from_context(ctx, "monthly", current_user, db)
    return {"month": month, "context": ctx, "alerts": alerts}

@router.get("/daily-digest")
def get_daily_digest(
    day: date = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns yesterday's context, rule-driven alerts, and micro-tips.
    """
    ctx        = build_daily_context(current_user, day, db)
    alerts     = evaluate_rules_from_context(ctx, "daily", current_user, db)
    micro_tips = compute_daily_micro_tips(ctx, current_user)
    return {
        "date": day,
        "context": ctx,
        "alerts": alerts,
        "micro_tips": micro_tips,
    }