// src/pages/Onboarding/GoalStep.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';

const schema = z.object({
      goal: z.enum(['gain muscle', 'maintenance', 'fat loss', 'weight loss']),
      activity_level: z.enum(['low', 'moderate', 'high']),
      weight_target: z.number().min(0, 'Target must be positive'),
      weight_target_unit: z.enum(['kg', 'lb']),
    });
export type GoalData = z.infer<typeof schema>;

interface Props {
  defaultValues: Partial<GoalData>;
  onPrev: () => void;
  onNext: (data: GoalData) => void;
}

export function GoalStep({ defaultValues, onPrev, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoalData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <div className="max-w-md mx-auto">
      {/* progress ------------------------------------------------ */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2 px-1">
          <span>Step 2 of 4</span>
          <span>Your Goals</span>
        </div>
        <div className="h-2 w-full bg-[var(--border)] rounded">
          <div className="h-full w-1/2 bg-[var(--accent)] rounded" />
        </div>
      </div>

      {/* card ---------------------------------------------------- */}
      <form
        onSubmit={handleSubmit(onNext)}
        className="hoverable card-base p-6 sm:p-8 space-y-6"
      >
        {/* heading */}
        <div>
          <h2 className="text-2xl font-semibold mb-1">Set your goals</h2>
          <p className="text-gray-500">
            What are you aiming for and how active are you?
          </p>
        </div>

        {/* goal */}
        <div>
          <label className="block text-sm font-medium mb-1">Goal</label>
          <select
          {...register('goal')}
          className="input w-full"
        >
            <option value="gain muscle">Gain Muscle</option>
            <option value="maintenance">Maintenance</option>
            <option value="fat loss">Fat Loss</option>
            <option value="weight loss">Weight Loss</option>
          </select>
          {errors.goal && (
            <p className="text-red-500 text-xs mt-1">{errors.goal.message}</p>
          )}
        </div>

        {/* activity level */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Activity Level
          </label>
          <select
          {...register('activity_level')}
          className="input w-full"
            >  
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
          {errors.activity_level && (
            <p className="text-red-500 text-xs mt-1">
              {errors.activity_level.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium mb-1">
            Target Weight
            </label>
            <input
            type="number"
            {...register('weight_target', { valueAsNumber: true })}
            className="input w-full"
            />
            {errors.weight_target && (
            <p className="text-red-500 text-xs mt-1">
                {errors.weight_target.message}
            </p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select {...register('weight_target_unit')} className="input w-full">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
            </select>
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