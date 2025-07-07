import { useForm } from 'react-hook-form';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  splits: SplitTemplateOut[];
  defaultSplitId?: string;
  onNext: (data: { split_template_id: string }) => void;
}

export function SplitStep({ splits, defaultSplitId, onNext }: Props) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } =
    useForm<{ split_template_id: string }>({
      defaultValues: { split_template_id: defaultSplitId },
    });

  if (splits.length === 0) {
    return (
      <div className="space-y-4">
        <p>No workout splits found.</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            navigate('/splits/create');
          }}
        >
          Create New Split
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await onNext(data);
        navigate('/dashboard');
      })}
      className="space-y-4"
    >
      <h2 className="text-xl font-heading">Choose a workout split</h2>
      <div className="space-y-2">
        {splits.map((s) => (
          <label key={s.id} className="flex items-center space-x-2">
            <input
              type="radio"
              value={s.id}
              {...register('split_template_id')}
              className="radio"
            />
            <span>
              <strong>{s.name}</strong> ({s.type})
            </span>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary mt-4"
      >
        Finish
      </button>
    </form>
  );
}