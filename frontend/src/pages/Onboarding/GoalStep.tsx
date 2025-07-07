// src/pages/Onboarding/GoalStep.tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'

const schema = z.object({
  goal: z.enum(['gain muscle', 'maintenance', 'fat loss', 'weight loss']),
  activity_level: z.enum(['low', 'moderate', 'high']),
})
type FormData = z.infer<typeof schema>

interface Props {
  defaultValues: Partial<FormData>
  onNext: (data: FormData) => void
}

export function GoalStep({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="text-xl font-heading">Set your goals</h2>

      <div>
        <label className="block">Goal</label>
        <select {...register('goal')} className="input w-full">
          <option value="gain muscle">Gain Muscle</option>
          <option value="maintenance">Maintenance</option>
          <option value="fat loss">Fat Loss</option>
          <option value="weight loss">Weight Loss</option>
        </select>
        {errors.goal && <p className="text-red-500">{errors.goal.message}</p>}
      </div>

      <div>
        <label className="block">Activity Level</label>
        <select {...register('activity_level')} className="input w-full">
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </select>
        {errors.activity_level && (
          <p className="text-red-500">{errors.activity_level.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary mt-4"
      >
        Next
      </button>
    </form>
  )
}