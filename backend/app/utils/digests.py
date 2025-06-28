# app/utils/digests.py

from typing import List, Dict, Any
from app.models import User

def compute_daily_micro_tips(ctx: Dict[str, Any], user: User) -> List[str]:
    """
    Returns a list of one-line micro-tips based on yesterday's context vs. the user's targets.
    """
    tips: List[str] = []

    # Protein
    protein_pct = ctx.get("protein_pct", 0)
    if protein_pct < 100:
        tips.append(f"You hit only {protein_pct:.0f}% of your protein goal—try adding more protein sources.")

    # Carbs
    carbs_pct = ctx.get("carbs_pct", 0)
    if carbs_pct < 100:
        tips.append(f"Carbs were at {carbs_pct:.0f}% of target—consider a healthy carb snack.")

    # Fat
    fat_pct = ctx.get("fat_pct", 0)
    if fat_pct < 100:
        tips.append(f"Fat intake was {fat_pct:.0f}% of target—remember your essential fats.")

    # Calories vs. maintenance
    deficit = ctx.get("cal_deficit_pct", 0) * 100
    if deficit < -5:
        tips.append(f"Calories were {abs(deficit):.0f}% below maintenance—eat a bit more if you’re low on energy.")
    elif deficit > 5:
        tips.append(f"Calories were {deficit:.0f}% above maintenance—watch for surplus if fat loss is the goal.")

    # Sleep
    sleep_h = ctx.get("sleep_h", 0.0)
    if sleep_h < 7:
        tips.append(f"Only slept {sleep_h:.1f}h—aim for at least 7h tonight for better recovery.")

    # Recovery metrics
    if ctx.get("hrv", 0) < 50:
        tips.append("Your HRV is low—consider extra rest or light activity today.")
    if ctx.get("resting_hr", 0) > 70:
        tips.append("Resting heart rate is a bit elevated—keep an eye on stress and recovery.")

    return tips