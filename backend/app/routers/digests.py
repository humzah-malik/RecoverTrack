# app/routers/digests.py
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database      import SessionLocal
from app.routers.auth  import get_current_user
from app.models        import User
from app.utils.context import (
    build_daily_context,
    build_weekly_context,
    build_monthly_context,
)
from app.utils.rules   import evaluate_rules_from_context
from app.utils.digests import compute_daily_micro_tips
from app.utils.digests import is_empty_ctx

router = APIRouter(prefix="/digests", tags=["digests"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/daily")
def daily_digest(
    day: date | None = Query(None, description="YYYY-MM-DD (defaults to *today*)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = day or date.today()

    ctx = build_daily_context(current_user, target, db)

    if is_empty_ctx(ctx):
        return {"date": target, "alerts": [], "micro_tips": []}

    rules = evaluate_rules_from_context(
        ctx, timeframe="daily", user=current_user, db=db
    )
    tips  = compute_daily_micro_tips(ctx, current_user)

    # align to schema names
    return {
        "date"       : target,
        "alerts"     : rules,   # <- RULES
        "micro_tips" : tips     # <- TIPS
    }

# optional ↓↓↓
# @router.get("/weekly")
# def weekly_digest(...):

#@router.get("/monthly")
# def monthly_digest(...):