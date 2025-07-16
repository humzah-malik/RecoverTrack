from datetime import date
import os
from supabase import create_client, Client
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from app.schemas import RecoveryPredictRequest, RecoveryPredictResponse, RecoveryPredictionOut
from app.database import get_db
from app.models import DailyLog
from app.routers.auth import get_current_user

from app.utils.context import (
    predict_recovery,
    apply_user_head,
    GLOBAL_MEAN,
    preprocessor,
    ALL_MUSCLES,
    build_daily_context,
)
from pydantic import ValidationError
from sqlalchemy.dialects.postgresql import insert
from app.models import RecoveryPrediction
from datetime import timedelta
from app.models import User

_url  = os.getenv("SUPABASE_URL")
_key  = (
     os.environ.get("SUPABASE_KEY")          # ← prefer server-side key if you add it
     or os.environ["SUPABASE_SERVICE_KEY"]    # ← fall back to SERVICE key
 )
supabase: Client = create_client(_url, _key)

router = APIRouter(prefix="/recovery", tags=["recovery"])

def resolve_template_info(db: Session, tpl_id: str, session_name: str):
    """
    Returns (split_type:str, muscle_groups:list[str])
    """
    from app.models import SplitTemplate, SplitSession

    if not tpl_id or not session_name:
        return "", []

    tpl = db.query(SplitTemplate).filter_by(id=tpl_id).first()
    if not tpl:
        return "", []

    sess = (
        db.query(SplitSession)
          .filter_by(template_id=tpl_id, name=session_name)
          .first()
    )
    muscles = sess.muscle_groups if sess else []
    return tpl.type, muscles


@router.post("/predict", response_model=RecoveryPredictResponse)
async def predict(
    request: Request,
    # req: RecoveryPredictRequest,
    debug: bool = Query(False, description="Include full context in response"),
    db: Session = Depends(get_db),
    me = Depends(get_current_user),
):
    try:
        # Manually extract and print the incoming JSON body
        body = await request.json()
        print("📥 Raw body received by /recovery/predict:", body)

        # Validate the request body using your Pydantic schema
        req = RecoveryPredictRequest(**body)

    except ValidationError as ve:
        print("❌ Validation Error in RecoveryPredictRequest:")
        for err in ve.errors():
            print(f"  → {err['loc']}: {err['msg']}")
        return JSONResponse(status_code=422, content={"detail": ve.errors()})

    except Exception as e:
        print("🔥 Unexpected Error parsing request:", str(e))
        return JSONResponse(status_code=400, content={"detail": str(e)})
    
    # 1) guard
    if me.id != req.user_id:
        raise HTTPException(403, "can only predict your own recovery")

    # 2) pick a date
    up_to = req.date or date.today()


    # 3) core day‐of metrics (fills zeros/defaults if no log exists)
    ctx = build_daily_context(me, up_to, db)

    today_log = (
    db.query(DailyLog)
      .filter(DailyLog.user_id == me.id, DailyLog.date == up_to)
      .first()
    )
    if today_log and today_log.water_intake_l is not None:
        ctx["water_intake_l"] = today_log.water_intake_l

    minimal = ("sleep_start", "sleep_end", "sleep_quality")

    if not today_log or not any(getattr(today_log, f) for f in minimal):
        # *Either* return HTTP 422 so the frontend can show "--"
        # *or* return 200 with {"predicted_recovery_rating": None}
        raise HTTPException(422, "No morning check-in yet")

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
    ctx["soreness_roll3"]       = df_hist["soreness"].mean() if "soreness" in df_hist else 0.0
    ctx["stress_roll3"]         = df_hist["stress"].mean() if "stress" in df_hist else 0.0
    ctx["sleep_quality_roll3"]  = df_hist["sleep_quality"].mean() if "sleep_quality" in df_hist else 0.0

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

    tpl_type, muscles = resolve_template_info(
    db,
    ctx.get("split_template_id") or getattr(
        db.query(DailyLog)
           .filter(DailyLog.user_id==me.id, DailyLog.date==up_to)
           .first(), "split_template_id", None),
    ctx.get("split")
    )

    ctx["split_type"] = tpl_type or ""

    # 7) categorical features
    ctx["sex"]            = me.sex or ""
    ctx["goal"]           = me.goal or ""
    ctx["activity_level"] = me.activity_level or ""

    # 8) muscle-group flags
    # ---------------------------------------------------------
    log_muscles = getattr(today_log, "muscle_groups", None)

    # 2) if the log didn’t store them, fall back to the session's muscles
    muscles_today = log_muscles or muscles        # ‘muscles’ came from resolve_template_info

    for m in ALL_MUSCLES:                         # list used during model training
        ctx[m] = 1 if muscles_today and m in muscles_today else 0

    # 9) user_bias fallback
    avg = db.query(func.avg(DailyLog.recovery_rating)) \
            .filter(DailyLog.user_id==me.id) \
            .scalar()
    ctx["user_bias"] = float(avg if avg is not None else GLOBAL_MEAN or 0.0)

    # 10) assemble the DataFrame in the exact order your preprocessor expects:
    in_cols = list(preprocessor.feature_names_in_)   # these are the  input columns
    row = [ctx.get(c, 0) for c in in_cols]
    df_pred = pd.DataFrame([row], columns=in_cols)

    if debug:
        print("\n─── RECOVERY DEBUG ─────────────────────────────────────────")
        print("Context (ctx) key → value")
        for k, v in ctx.items():
            print(f"  {k}: {v}")
        print("\nModel input (df_pred):")
        print(df_pred.to_string(index=False))
        print("──────────────────────────────────────────────────────────────\n")

    # 11) predict!
    raw_score = predict_recovery(df_pred)
    score = apply_user_head(me.id, raw_score, db)
    stmt = insert(RecoveryPrediction).values(
        user_id=me.id,
        date=up_to,
        score=score
    ).on_conflict_do_update(
        index_elements=['user_id', 'date'],
        set_=dict(score=score, created_at=func.now())
    )
    db.execute(stmt)
    db.commit()

    if debug:
        # return the raw context and the DF that went to the preprocessor
        return {
        "predicted_recovery_rating": score,
        "raw_global_score":          raw_score,
        "ctx":                       ctx,
        "model_input":               df_pred.to_dict(orient="list"),
    }
    return RecoveryPredictResponse(predicted_recovery_rating=score)

@router.get( "/history",response_model=list[RecoveryPredictionOut],)
def recovery_history(start: date = Query(..., description="Start date of the history window (YYYY-MM-DD)"),
    days: int = Query(
        30,
        ge=1,
        description="Number of days to include starting from `start`",
    ),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    Returns all recovery predictions for the current user
    between `start` and `start + days - 1` (inclusive), ordered by date.
    """
    since = start
    until = start + timedelta(days=days - 1)

    rows = (
        db.query(RecoveryPrediction)
          .filter(
              RecoveryPrediction.user_id == me.id,
              RecoveryPrediction.date >= since,
              RecoveryPrediction.date <= until,
          )
          .order_by(RecoveryPrediction.date)
          .all()
    )
    return rows