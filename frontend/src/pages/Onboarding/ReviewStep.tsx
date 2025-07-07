// src/pages/Onboarding/ReviewStep.tsx
import { useForm } from 'react-hook-form'
import React, { useEffect } from 'react'
import { computeNutritionProfile } from '../../utils/nutrition'
import type { UserOut } from '../../api/auth'

interface Props {
  profile: UserOut
  onNext: (data: {
    maintenance_calories: number
    macro_targets: { protein: number; carbs: number; fat: number }
  }) => void
}

type FormData = {
  maintenance_calories: number
  macro_targets: {
    protein: number
    carbs: number
    fat: number
  }
}

export function ReviewStep({ profile, onNext }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } =
    useForm<FormData>({
      defaultValues: {
        maintenance_calories: 0,
        macro_targets: { protein: 0, carbs: 0, fat: 0 },
      },
    })

  // compute initial defaults once
  useEffect(() => {
    const {
      maintenanceCalories,
      macroTargets,
    } = computeNutritionProfile({
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
    })

    setValue('maintenance_calories', maintenanceCalories)
    setValue('macro_targets', macroTargets)
  }, [profile, setValue])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <h2 className="text-xl font-heading">Review & Edit Your Targets</h2>

      <div className="p-4 border rounded-lg space-y-2">
        <label className="block font-medium">Calories</label>
        <input
          type="number"
          {...register('maintenance_calories', { valueAsNumber: true })}
          className="input w-full"
        />
      </div>

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

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
      >
        Next: Choose Split
      </button>
    </form>
  )
}