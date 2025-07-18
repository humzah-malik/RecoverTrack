// src/utils/nutrition.ts

export const TDEE_MULTIPLIERS: Record<string, number> = {
    low:      1.2,
    moderate: 1.375,
    high:     1.55,
  };
  
  export const MACROS_G_PER_KG: Record<string, Record<string, number>> = {
    'gain muscle':   { protein: 2.0, carbs: 4.0, fat: 1.0 },
    'maintenance':   { protein: 1.8, carbs: 3.0, fat: 0.8 },
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
    goal,
  }: {
    sex: string;
    age: number;
    weight: number;
    height: number;
    height_unit: string;
    weight_unit: string;
    activity_level: string;
    goal?: string | null;
  }): {
    maintenanceCalories: number;
    macroTargets: { protein: number; carbs: number; fat: number };
  } {
    // 1) BMR → TDEE
    const bmr = computeBMR(sex, age, weight, height, height_unit, weight_unit);
    const tdee = bmr * TDEE_MULTIPLIERS[activity_level || 'moderate'];
  
    // 2) Goal adjustment
    const g = (goal || 'maintenance').toLowerCase();
    let goalCals: number;
    if (g === 'fat loss') {
      goalCals = tdee - 200;
    } else if (g === 'weight loss') {
      goalCals = tdee - 500;
    } else if (g === 'gain muscle') {
      goalCals = tdee + 200;
    } else {
      goalCals = tdee;
    }
    const maintenanceCalories = Math.round(goalCals);
  
    // 3) Macro targets
    const gramsPerKg = MACROS_G_PER_KG[g] ?? MACROS_G_PER_KG['maintenance'];
    const w_kg = weight_unit === 'kg' ? weight : weight * 0.453592;
    const macroTargets = {
      protein: Math.round(gramsPerKg.protein * w_kg),
      carbs:   Math.round(gramsPerKg.carbs * w_kg),
      fat:     Math.round(gramsPerKg.fat * w_kg),
    };
  
    return { maintenanceCalories, macroTargets };
  }  