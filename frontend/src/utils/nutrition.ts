// src/utils/nutrition.ts

export const TDEE_MULTIPLIERS: Record<string, number> = {
    low:      1.2,
    moderate: 1.375,
    high:     1.55,
  };
  
  const CAL_ADJUST_PER_KG = 1100 / 7;
  
  export const MACROS_G_PER_KG: Record<string, Record<string, number>> = {
    'gain muscle':   { protein: 2.0, carbs: 4.0, fat: 1.0 },
    'maintenance':     { protein: 1.8, carbs: 3.0, fat: 0.8 },
    'fat loss':      { protein: 2.2, carbs: 2.5, fat: 0.8 },
    'weight loss':   { protein: 2.0, carbs: 2.0, fat: 0.8 },
  };
  
  export function computeBMR(
    sex: string,
    age: number,
    weight: number,
    height: number,
    height_unit: string,
    weight_unit: string
  ): number {
    const w_kg = weight_unit === 'kg' ? weight : weight * 0.453592;
    const h_cm = height_unit === 'cm' ? height : height * 2.54;
    if (sex.toLowerCase() === 'male') {
      return 10 * w_kg + 6.25 * h_cm - 5 * age + 5;
    } else {
      return 10 * w_kg + 6.25 * h_cm - 5 * age - 161;
    }
  }
  
  export function computeNutritionProfile({
    sex,
    age,
    weight,
    height,
    height_unit,
    weight_unit,
    activity_level,
    weight_target,
    weight_target_unit,
    goal,
  }: {
    sex: string;
    age: number;
    weight: number;
    height: number;
    height_unit: string;
    weight_unit: string;
    activity_level: string;
    weight_target?: number | null;
    weight_target_unit?: string | null;
    goal?: string | null;
  }): {
    maintenanceCalories: number;
    macroTargets: { protein: number; carbs: number; fat: number };
  } {
    const bmr = computeBMR(sex, age, weight, height, height_unit, weight_unit);
    const tdee = bmr * TDEE_MULTIPLIERS[activity_level || 'moderate'];
  
    let cal_adjust = 0;
    if (weight_target != null && weight_target_unit) {
      const cur_w =
        weight_unit === 'kg' ? weight : weight * 0.453592;
      const tgt_w =
        weight_target_unit === 'kg'
          ? weight_target
          : weight_target * 0.453592;
      cal_adjust = CAL_ADJUST_PER_KG * (tgt_w - cur_w);
    }
  
    const maintenanceCalories = Math.round(tdee + cal_adjust);
  
    const goalKey = (goal || 'maintenance').toLowerCase();
    const gramsPerKg =
      MACROS_G_PER_KG[goalKey] ?? MACROS_G_PER_KG['maintenance'];
    const w_kg = weight_unit === 'kg' ? weight : weight * 0.453592;
  
    const macroTargets = {
      protein: Math.round(gramsPerKg.protein * w_kg),
      carbs:   Math.round(gramsPerKg.carbs * w_kg),
      fat:     Math.round(gramsPerKg.fat * w_kg),
    };
  
    return { maintenanceCalories, macroTargets };
  }  