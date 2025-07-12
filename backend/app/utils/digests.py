# app/utils/digests.py
from typing import List, Dict, Any, Optional
import math
from app.models import User

def _clean(val: Any) -> Optional[float]:
    """
    Return None for “empty” values so downstream checks can skip them.
    None, '', 0 / 0.0, or NaN  → None
    Anything else              → as-is
    """
    if val in (None, '', 0, 0.0):
        return None
    try:
        if isinstance(val, float) and math.isnan(val):
            return None
    except Exception:
        pass
    return val

def _nan_or_zero(x: Any) -> bool:
    import math
    return (x in (None, '', 0, 0.0)) or (isinstance(x, float) and math.isnan(x))

def is_empty_ctx(ctx: Dict[str, Any]) -> bool:
    """Return True when every *numeric* signal is missing/0."""
    key_subsets = [
        "sleep_h", "sleep_quality", "resting_hr", "hrv",
        "total_sets", "calories", "protein_pct", "carbs_pct", "fat_pct",
    ]
    return all(_nan_or_zero(ctx.get(k)) for k in key_subsets)


def compute_daily_micro_tips(ctx: Dict[str, Any], user: User) -> List[str]:
    """
    One-line micro-tips based on yesterday's context vs. the user's targets.
    Tips are shown **only** when the underlying metric is *present* and *non-zero*.
    """
    tips: List[str] = []

    # ── Macronutrients ───────────────────────────────────────────
    protein_pct = _clean(ctx.get("protein_pct"))
    if protein_pct is not None and protein_pct < 100:
        tips.append(
            f"You hit only {protein_pct:.0f}% of your protein goal—try adding more protein sources."
        )

    carbs_pct = _clean(ctx.get("carbs_pct"))
    if carbs_pct is not None and carbs_pct < 100:
        tips.append(
            f"Carbs were at {carbs_pct:.0f}% of target—consider a healthy carb snack."
        )

    fat_pct = _clean(ctx.get("fat_pct"))
    if fat_pct is not None and fat_pct < 100:
        tips.append(
            f"Fat intake was {fat_pct:.0f}% of target—remember your essential fats."
        )

    # ── Calories vs. maintenance ─────────────────────────────────
    deficit_pct = _clean(ctx.get("cal_deficit_pct"))
    if deficit_pct is not None:
        deficit_pct *= 100  # convert fraction → %
        if deficit_pct < -5:
            tips.append(
                f"Calories were {abs(deficit_pct):.0f}% below maintenance—eat a bit more if you’re low on energy."
            )
        elif deficit_pct > 5:
            tips.append(
                f"Calories were {deficit_pct:.0f}% above maintenance—watch for surplus if fat loss is the goal."
            )

    # ── Sleep hours ──────────────────────────────────────────────
    sleep_h = _clean(ctx.get("sleep_h"))
    if sleep_h is not None and sleep_h < 7:
        tips.append(
            f"Only slept {sleep_h:.1f} h—aim for at least 7 h tonight for better recovery."
        )

    # ── Recovery metrics ────────────────────────────────────────
    hrv = _clean(ctx.get("hrv"))
    if hrv is not None and hrv < 50:
        tips.append("Your HRV is low—consider extra rest or light activity today.")

    rhr = _clean(ctx.get("resting_hr"))
    if rhr is not None and rhr > 70:
        tips.append("Resting heart rate is a bit elevated—keep an eye on stress and recovery.")

    return tips