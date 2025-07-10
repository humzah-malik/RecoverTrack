# backend/app/utils/nutrition.py

from typing import Tuple, Dict
from app.models import User

# Caloric multipliers for activity levels
TDEE_MULTIPLIERS = {
    "low":      1.2,
    "moderate": 1.375,
    "high":     1.55,
}

# ~1100 kcal/week per kg → ≈157 kcal/day per kg
CAL_ADJUST_PER_KG = 1100 / 7  

# Macro grams per kg of bodyweight by goal
MACROS_G_PER_KG = {
    "gain muscle": {"protein": 2.0, "carbs": 4.0, "fat": 1.0},
    "maintenance": {"protein": 1.8, "carbs": 3.0, "fat": 0.8},
    "fat loss":    {"protein": 2.2, "carbs": 2.5, "fat": 0.8},
    "weight loss": {"protein": 2.0, "carbs": 2.0, "fat": 0.8},
}

def compute_bmr(sex: str, age: int, weight: float, height: float,
                height_unit: str, weight_unit: str) -> float:
    # Mifflin-St Jeor
    w_kg = weight if weight_unit == "kg" else weight * 0.453592
    h_cm = height if height_unit == "cm" else height * 2.54
    if sex.lower() == "male":
        return 10 * w_kg + 6.25 * h_cm - 5 * age + 5
    else:
        return 10 * w_kg + 6.25 * h_cm - 5 * age - 161

def compute_nutrition_profile(user: User) -> Tuple[int, Dict[str,int]]:
    # BMR → TDEE
    bmr = compute_bmr(user.sex, user.age, user.weight,
                      user.height, user.height_unit, user.weight_unit)
    tdee = bmr * TDEE_MULTIPLIERS.get(user.activity_level or "moderate", 1.375)

    # Caloric adjustment toward target
    if user.weight_target is not None:
        cur_w = user.weight if user.weight_unit == "kg" else user.weight * 0.453592
        tgt_w = user.weight_target if user.weight_target_unit == "kg" else user.weight_target * 0.453592
        delta_kg = tgt_w - cur_w
        cal_adjust = CAL_ADJUST_PER_KG * delta_kg
    else:
        cal_adjust = 0

    maintenance_cals = int(round(tdee + cal_adjust))

    # 3) Macro targets
    goal_key = user.goal.lower() if user.goal else "maintenance"
    grams_per_kg = MACROS_G_PER_KG.get(goal_key, MACROS_G_PER_KG["maintenance"])
    w_kg = user.weight if user.weight_unit == "kg" else user.weight * 0.453592

    macro_targets = {
        k: int(round(grams_per_kg[k] * w_kg))
        for k in grams_per_kg
    }

    return maintenance_cals, macro_targets