# app/utils/context.py

from datetime import date, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models import DailyLog, User
import joblib
import torch
from torch import nn
import numpy as np
import pandas as pd
from pathlib import Path
import os

BASE = Path(__file__).resolve().parent.parent
LATEST_DIR = BASE.parent / "models" / "latest"
FALLBACK_DIR = BASE

def try_load(name, ext):
    for base in [LATEST_DIR, FALLBACK_DIR]:
        path = base / f"{name}.{ext}"
        if path.exists():
            if ext == "pkl":
                with open(path, "rb") as f:
                    return joblib.load(f)
            elif ext == "joblib":
                return joblib.load(path)
            elif ext == "pt":
                return torch.load(path, map_location=_device)
    raise FileNotFoundError(f"Could not find {name}.{ext} in latest/ or fallback dir")

# Set up model and preprocessor
preprocessor = try_load("recovery_preproc_with_user_bias", "joblib")
class MLP(nn.Module):
    def __init__(self, in_dim, hidden=32):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden, 1),
        )
    def forward(self, x): return self.net(x).squeeze(1)

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

num_pipe = preprocessor.named_transformers_['num']
num_dim = num_pipe.named_steps['scale'].n_features_in_
cat_enc = preprocessor.named_transformers_['cat']
cat_dim = sum(len(cats) for cats in cat_enc.categories_)
_in_dim = num_dim + cat_dim

_model = MLP(_in_dim, hidden=32).to(_device)
_model.load_state_dict(try_load("recovery_mlp_with_user_bias", "pt"))
_model.eval()

GLOBAL_MEAN = try_load("recovery_global_mean", "pkl")
ALL_MUSCLES = try_load("recovery_all_muscles", "pkl")
Y_MEAN = try_load("recovery_y_mean", "pkl")
Y_STD  = try_load("recovery_y_std", "pkl")

def predict_recovery(df: pd.DataFrame) -> float:
    X = preprocessor.transform(df)
    t = torch.tensor(X, dtype=torch.float32, device=_device)
    with torch.no_grad():
        out_norm = _model(t).cpu().numpy().item()
    # convert back to the original 0–100 scale:
    return float(out_norm * Y_STD + Y_MEAN)

def build_daily_context(user: User, up_to: date, db: Session) -> Dict[str, Any]:
    """
    Build a context dict of daily metrics for the user on date `up_to`.
    Used for rule evaluation, ML features, and analytics endpoints.
    """
    log = (
        db.query(DailyLog)
          .filter(DailyLog.user_id == user.id, DailyLog.date == up_to)
          .first()
    )
    if not log:
        log = DailyLog()  # empty defaults

    # Core fields
    ctx: Dict[str, Any] = {
        "date": up_to.isoformat(),
        "trained": int(bool(log.trained)),
        "split": log.split or "",
        "total_sets": log.total_sets or 0,
        "failure_sets": log.failure_sets or 0,
        "total_rir": log.total_rir or 0,
        "calories": log.calories or 0,
        "sleep_quality": log.sleep_quality or 0,
        "resting_hr": log.resting_hr or 0,
        "hrv": log.hrv or 0.0,
        "stress": log.stress or 0,
        "motivation": log.motivation or 0,
        "water_intake_l": log.water_intake_l or 0.0,
    }

    # Compute sleep hours
    if log.sleep_start and log.sleep_end:
        try:
            sh, sm = map(int, log.sleep_start.split(":"))
            eh, em = map(int, log.sleep_end.split(":"))
            # raw difference in minutes
            delta = (eh * 60 + em) - (sh * 60 + sm)
            # if negative, you crossed midnight → add 24h
            if delta < 0:
                delta += 24 * 60
            ctx["sleep_h"] = delta / 60.0
        except ValueError:
            ctx["sleep_h"] = 0.0
    else:
        ctx["sleep_h"] = 0.0

    # Avoid divide-by-zero when no sets
    sets_for_calc = ctx["total_sets"] if ctx["total_sets"] > 0 else 1
    ctx["failure_pct"] = ctx["failure_sets"] / sets_for_calc
    ctx["avg_rir"]    = ctx["total_rir"] / sets_for_calc

    # Calorie deficit vs. maintenance
    maintenance = user.maintenance_calories or 1
    ctx["cal_deficit_pct"] = (ctx["calories"] - maintenance) / maintenance

    # Macros as percentage of targets
    targets = user.macro_targets or {}
    p_t = targets.get("protein", 0) or 1
    c_t = targets.get("carbs",   0) or 1
    f_t = targets.get("fat",     0) or 1
    m    = log.macros or {}

    ctx["protein_pct"] = (m.get("protein", 0) / p_t) * 100
    ctx["carbs_pct"]   = (m.get("carbs",   0) / c_t) * 100
    ctx["fat_pct"]     = (m.get("fat",     0) / f_t) * 100

    # Pass through soreness JSON
    ctx["soreness"] = log.soreness or {}

    return ctx


def build_weekly_context(user: User, up_to: date, db: Session) -> Dict[str, Any]:
    """
    Build a context dict of weekly aggregates for the 7-day period ending at `up_to`.
    """
    start = up_to - timedelta(days=6)
    logs  = (
        db.query(DailyLog)
          .filter(DailyLog.user_id == user.id,
                  DailyLog.date.between(start, up_to))
          .all()
    )
    days = logs or []
    cal_days = sum(1 for l in days if l.calories is not None)
    sleep_days = sum(1 for l in days if l.sleep_start and l.sleep_end)
    sq_days = sum(1 for l in days if l.sleep_quality is not None)
    macro_days = sum(1 for l in days if l.macros and user.macro_targets)
    n_days = len(days) if days else 1

    # Straight sums
    total_sets = sum(l.total_sets or 0 for l in days)
    failure_sets = sum(l.failure_sets or 0 for l in days)
    total_rir = sum(l.total_rir or 0 for l in days)
    calories_sum = sum(l.calories or 0 for l in days)

    # Sleep & macros
    sleep_h_sum = 0.0
    sleep_quality_sum = 0
    protein_pct_sum = 0.0
    carbs_pct_sum = 0.0
    fat_pct_sum = 0.0
    trained_count = 0

    targets = user.macro_targets or {}
    p_t = targets.get("protein", 0) or 1
    c_t = targets.get("carbs",   0) or 1
    f_t = targets.get("fat",     0) or 1

    for l in days:
        if l.trained:
            trained_count += 1

        # Sleep accumulation
        if l.sleep_start and l.sleep_end:
            try:
                sh, sm = map(int, l.sleep_start.split(":"))
                eh, em = map(int, l.sleep_end.split(":"))
                delta = (eh * 60 + em) - (sh * 60 + sm)
                if delta < 0:
                    delta += 24 * 60
                sleep_h_sum += delta / 60.0
            except ValueError:
                pass

        sleep_quality_sum += (l.sleep_quality or 0)

        # Macro percentages
        m = l.macros or {}
        protein_pct_sum += (m.get("protein", 0) / p_t) * 100
        carbs_pct_sum   += (m.get("carbs",   0) / c_t) * 100
        fat_pct_sum     += (m.get("fat",     0) / f_t) * 100

    return {
        "start_date":         start.isoformat(),
        "end_date":           up_to.isoformat(),
        "weekly_sessions":    trained_count,
        "weekly_total_sets":  total_sets,
        "weekly_failure_sets":failure_sets,
        "weekly_total_rir":   total_rir,
        "pct_failure":        (failure_sets / total_sets) if total_sets else 0,
        "avg_rir":            (total_rir / total_sets) if total_sets else 0,
        "avg_calories":       calories_sum / (cal_days   or 1),
        "total_calories":     calories_sum,
        "avg_sleep_h":        sleep_h_sum   / (sleep_days or 1),
        "avg_sleep_quality":  sleep_quality_sum / (sq_days   or 1),
        "avg_protein_pct":    protein_pct_sum / (macro_days or 1),
        "avg_carbs_pct":      carbs_pct_sum     / (macro_days or 1),
        "avg_fat_pct":        fat_pct_sum       / (macro_days or 1),
    }


def build_monthly_context(user: User, month: str, db: Session) -> Dict[str, Any]:
    """
    Build a context dict of monthly aggregates for the calendar month 'YYYY-MM'.
    """
    year, mon = map(int, month.split("-"))
    start     = date(year, mon, 1)
    # first day of next month
    if mon == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, mon + 1, 1)

    logs   = (
        db.query(DailyLog)
          .filter(DailyLog.user_id == user.id,
                  DailyLog.date >= start,
                  DailyLog.date <  next_month)
          .all()
    )
    days      = logs or []
    cal_days = sum(1 for l in days if l.calories is not None)
    sleep_days = sum(1 for l in days if l.sleep_start and l.sleep_end)
    sq_days = sum(1 for l in days if l.sleep_quality is not None)
    macro_days = sum(1 for l in days if l.macros and user.macro_targets)
    n_days = len(days) if days else 1

    total_sets   = sum(l.total_sets or 0 for l in days)
    failure_sets = sum(l.failure_sets or 0 for l in days)
    total_rir    = sum(l.total_rir or 0 for l in days)
    calories_sum = sum(l.calories or 0 for l in days)

    sleep_h_sum       = 0.0
    sleep_quality_sum = 0
    protein_pct_sum   = 0.0
    carbs_pct_sum     = 0.0
    fat_pct_sum       = 0.0
    compliance_hits   = 0
    trained_count     = 0

    targets = user.macro_targets or {}
    p_t = targets.get("protein", 0) or 1
    c_t = targets.get("carbs",   0) or 1
    f_t = targets.get("fat",     0) or 1

    for l in days:
        if l.trained:
            trained_count += 1
        if l.sleep_start and l.sleep_end:
            try:
                sh, sm = map(int, l.sleep_start.split(":"))
                eh, em = map(int, l.sleep_end.split(":"))
                delta = (eh * 60 + em) - (sh * 60 + sm)
                if delta < 0:
                    delta += 24 * 60
                sleep_h_sum += delta / 60.0
            except ValueError:
                pass
        sleep_quality_sum += (l.sleep_quality or 0)

        sleep_quality_sum += (l.sleep_quality or 0)

        # Macro percentages & compliance within ±10%
        m = l.macros or {}
        p_pct = (m.get("protein", 0) / p_t) * 100
        c_pct = (m.get("carbs",   0) / c_t) * 100
        f_pct = (m.get("fat",     0) / f_t) * 100

        protein_pct_sum += p_pct
        carbs_pct_sum   += c_pct
        fat_pct_sum     += f_pct

        if abs(p_pct - 100) <= 10 and abs(c_pct - 100) <= 10 and abs(f_pct - 100) <= 10:
            compliance_hits += 1

    # Weight progress: % toward user.weight_target
    # collect all logged weights
    weights = [l.weight for l in days if getattr(l, "weight", None) is not None]
    if weights:
        start_w, end_w = weights[0], weights[-1]
    else:
        start_w = end_w = user.weight or 0.0

    # normalize units to kg
    if user.weight_unit != "kg":
        start_w *= 0.453592
        end_w   *= 0.453592
    tgt_w = (
        user.weight_target
        if user.weight_target_unit == "kg"
        else (user.weight_target or 0.0) * 0.453592
    )

    # percent toward target
    if tgt_w and (tgt_w - start_w):
        pct_to_target = (end_w - start_w) / (tgt_w - start_w) * 100
    else:
        pct_to_target = 0.0
    pct_to_target = round(pct_to_target, 1)

    avg_calories      = calories_sum      / (cal_days   or 1)
    avg_sleep_h       = sleep_h_sum       / (sleep_days or 1)
    avg_sleep_quality = sleep_quality_sum / (sq_days    or 1)
    avg_protein_pct   = protein_pct_sum   / (macro_days or 1)
    avg_carbs_pct     = carbs_pct_sum     / (macro_days or 1)
    avg_fat_pct       = fat_pct_sum       / (macro_days or 1)

    # build & return the context dict
    return {
        "start_date":              start.isoformat(),
        "end_date":                (next_month - timedelta(days=1)).isoformat(),
        "monthly_sessions":        trained_count,
        "monthly_total_sets":      total_sets,
        "monthly_failure_sets":    failure_sets,
        "monthly_total_rir":       total_rir,
        "monthly_avg_rir":         (total_rir / total_sets) if total_sets else 0,
        "macro_compliance_pct":    (compliance_hits / n_days) * 100,
        "monthly_total_calories":  calories_sum,
        "monthly_avg_calories":    avg_calories,
        "monthly_avg_sleep_h":     avg_sleep_h,
        "monthly_avg_sleep_quality": avg_sleep_quality,
        "monthly_avg_protein_pct": avg_protein_pct,
        "monthly_avg_carbs_pct":   avg_carbs_pct,
        "pct_to_target": pct_to_target,
        "monthly_avg_fat_pct":     avg_fat_pct,
    }