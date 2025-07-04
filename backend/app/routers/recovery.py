from datetime import date
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.schemas import RecoveryPredictRequest, RecoveryPredictResponse
from app.database import get_db
from app.models import DailyLog
from app.routers.auth import get_current_user

from app.utils.context import (
    predict_recovery,
    GLOBAL_MEAN,
    preprocessor,
    ALL_MUSCLES,
    build_daily_context,
)

router = APIRouter(prefix="/recovery", tags=["recovery"])

@router.post("/predict", response_model=RecoveryPredictResponse)
def predict(
    req: RecoveryPredictRequest,
    db: Session = Depends(get_db),
    me = Depends(get_current_user),
):
    # 1) guard
    if me.id != req.user_id:
        raise HTTPException(403, "can only predict your own recovery")

    # 2) pick a date
    up_to = req.date or date.today()

    # 3) core day‐of metrics (fills zeros/defaults if no log exists)
    ctx = build_daily_context(me, up_to, db)

    # 4) compute 3-day rolling averages for soreness, stress, sleep_quality
    recent = (
      db.query(DailyLog)
        .filter(
          DailyLog.user_id == me.id,
          DailyLog.date <= up_to
        )
        .order_by(DailyLog.date.desc())
        .limit(3)
        .all()
    )
    df_hist = pd.DataFrame([{
      "soreness":   l.soreness or 0,
      "stress":     l.stress   or 0,
      "sleep_quality": l.sleep_quality or 0
    } for l in recent])
    ctx["soreness_roll3"]       = df_hist["soreness"].mean()
    ctx["stress_roll3"]         = df_hist["stress"].mean()
    ctx["sleep_quality_roll3"]  = df_hist["sleep_quality"].mean()

    # 5) day-of-week & month features
    dow = up_to.weekday()
    moy = up_to.month - 1
    ctx["dow_sin"] = np.sin(2*np.pi * dow/7)
    ctx["dow_cos"] = np.cos(2*np.pi * dow/7)
    ctx["moy_sin"] = np.sin(2*np.pi * moy/12)
    ctx["moy_cos"] = np.cos(2*np.pi * moy/12)

    # 6) static user attributes
    ctx["age"]    = me.age or 0
    ctx["height"] = me.height or 0
    ctx["weight"] = me.weight or 0

    # 7) categorical features
    ctx["sex"]            = me.sex or ""
    ctx["goal"]           = me.goal or ""
    ctx["activity_level"] = me.activity_level or ""
    ctx["split_type"]     = ctx.get("split", "")   # from daily context

    # 8) muscle‐group flags
    #    if you stored muscle_groups on the DailyLog, pull them here;
    #    otherwise load today’s SplitSession via ctx["split"] → template → sessions
    muscles = getattr(db.query(DailyLog).filter(
      DailyLog.user_id==me.id,
      DailyLog.date==up_to
    ).first(), "muscle_groups", []) or []
    for m in ALL_MUSCLES:       # keep the same `all_muscles` list you used at train time
      ctx[m] = 1 if m in muscles else 0

    # 9) user_bias fallback
    avg = db.query(func.avg(DailyLog.recovery_rating)) \
            .filter(DailyLog.user_id==me.id) \
            .scalar()
    ctx["user_bias"] = float(avg if avg is not None else GLOBAL_MEAN or 0.0)

    # 10) assemble the DataFrame in the exact order your preprocessor expects:
    in_cols = list(preprocessor.feature_names_in_)   # these are the  input columns
    row = [ctx.get(c, 0) for c in in_cols]
    df_pred = pd.DataFrame([row], columns=in_cols)

    # 11) predict!
    score = predict_recovery(df_pred)
    return RecoveryPredictResponse(predicted_recovery_rating=score)