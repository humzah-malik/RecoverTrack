// src/pages/Onboarding/ReviewStep.tsx
import { useForm } from 'react-hook-form';
import React, { useEffect } from 'react';
import { computeNutritionProfile } from '../../utils/nutrition';
import type { UserOut } from '../../api/auth';

export interface ReviewData {
  maintenance_calories: number;
  macro_targets: { protein: number; carbs: number; fat: number };
}

interface Props {
  profile: UserOut;
  onPrev: () => void;
  onNext: (data: ReviewData) => void;
}

export function ReviewStep({ profile, onPrev, onNext }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<ReviewData>({
    defaultValues: {
      maintenance_calories: 0,
      macro_targets: { protein: 0, carbs: 0, fat: 0 },
    },
  });

  /* ─ compute defaults once ─ */
  useEffect(() => {
    const { maintenanceCalories, macroTargets } = computeNutritionProfile({
      sex: profile.sex!,
      age: profile.age!,
      weight: profile.weight!,
      height: profile.height!,
      height_unit: profile.height_unit!,
      weight_unit: profile.weight_unit!,
      activity_level: profile.activity_level!,
      weight_target: profile.weight_target,
      weight_target_unit: profile.weight_target_unit,
      goal: profile.goal,
    });
    setValue('maintenance_calories', maintenanceCalories);
    setValue('macro_targets', macroTargets);
  }, [profile, setValue]);

  return (
    <div className="max-w-md mx-auto">
      {/* progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2 px-1">
          <span>Step 3 of 4</span>
          <span>Review Targets</span>
        </div>
        <div className="h-2 w-full bg-[var(--border)] rounded">
          <div className="h-full w-3/4 bg-[var(--accent)] rounded" />
        </div>
      </div>

      {/* card */}
      <form
        onSubmit={handleSubmit(onNext)}
        className="hoverable card-base p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            Review & edit your targets
          </h2>
          <p className="text-gray-500">
            Adjust calories or macros if you want to fine-tune.
          </p>
        </div>

        {/* calories */}
        <div className="p-4 border rounded-lg space-y-2">
          <label className="block font-medium">Goal Calories</label>
          <input
            type="number"
            {...register('maintenance_calories', { valueAsNumber: true })}
            className="input w-full"
          />
        </div>

        {/* macros */}
        <div className="p-4 border rounded-lg space-y-2">
          <label className="block font-medium">Macro Targets (g)</label>
          <div className="grid grid-cols-3 gap-4">
            {(['protein', 'carbs', 'fat'] as const).map((m) => (
              <div key={m}>
                <label className="block capitalize">{m}</label>
                <input
                  type="number"
                  {...register(`macro_targets.${m}`, { valueAsNumber: true })}
                  className="input w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* nav buttons */}
        <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="btn btn-ghost"
        >
          ← Back
        </button>
          <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-dark"
        >
          Next Step →
        </button>
        </div>
      </form>
    </div>
  );
}