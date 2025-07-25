// src/pages/Onboarding/SplitStep.tsx
import { useForm, Controller } from 'react-hook-form';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface SplitTemplateOut {
  id: string;
  name: string;
  type: string;
}

interface Props {
  splits: SplitTemplateOut[];
  defaultSplitId?: string;
  onPrev: () => void;
  onNext: (data: { split_template_id: string }) => void;
}

export function SplitStep({
  splits,
  defaultSplitId,
  onPrev,
  onNext,
}: Props) {
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ split_template_id: string }>({
    defaultValues: { split_template_id: defaultSplitId || '' },
  });

  /* ---------- empty-state ------------------------------------------------ */
  if (splits.length === 0) {
    return (
      <div className="hoverable card-base p-6 sm:p-8 space-y-6">
        <p className="text-center">
          No workout splits found. Create one to finish onboarding.
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/splits/create')}
          >
            Create New Split
          </button>
        </div>
      </div>
    );
  }

  /* ---------- normal card ------------------------------------------------ */
  return (
    <div className="max-w-md mx-auto">
      {/* progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2 px-1">
          <span>Step 4 of 4</span>
          <span>Workout Split</span>
        </div>
        <div className="h-2 w-full bg-[var(--border)] rounded">
          <div className="h-full w-full bg-[var(--accent)] rounded" />
        </div>
      </div>

      {/* card */}
      <form
        onSubmit={handleSubmit(onNext)}
        className="  hoverable card-base p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            Choose a workout split
          </h2>
          <p className="text-gray-500">
            Pick a template or create your own routine later.
          </p>
        </div>

        {/* controlled list */}
        <Controller
          name="split_template_id"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div className="space-y-3">
              {splits.map((s) => {
                const isSelected = value === s.id;
                return (
                  <div key={s.id}>
                    <label
                      onClick={() => onChange(isSelected ? '' : s.id)}
                      className={
                        `flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[var(--surface-alt)] dark:hover:bg-[rgba(var(--accent-rgb)/0.07)] ` +
                        (isSelected
                          ? 'ring-2 ring-[var(--accent)] border-[var(--accent)]'
                          : ' border-[var(--border)]')
                      }
                    >
                      <span>
                        <strong>{s.name}</strong>{' '}
                        <span className="text-muted">({s.type})</span>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        />

        {/* nav buttons */}
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={onPrev}
            className="btn btn-ghost"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-dark"
          >
            Finish
          </button>
        </div>
      </form>
    </div>
  );
}