// src/pages/Onboarding/ProfileStep.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';

const schema = z.object({
  age: z.number().min(1, 'Age must be positive'),
  sex: z.enum(['male', 'female', 'other']),
  height: z.number().min(0, 'Required'),
  height_unit: z.enum(['cm', 'in']),
  weight: z.number().min(0, 'Required'),
  weight_unit: z.enum(['kg', 'lb']),
});
type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: Partial<FormData>;
  onNext: (data: FormData) => void;
}

export function ProfileStep({ defaultValues, onNext }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: defaultValues as any,
    });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <h2 className="text-xl font-heading">Tell us about you</h2>

      <div>
        <label className="block">Age</label>
        <input
          type="number"
          {...register('age', { valueAsNumber: true })}
          className="input w-full"
        />
        {errors.age && <p className="text-red-500">{errors.age.message}</p>}
      </div>

      <div>
        <label className="block">Sex</label>
        <select {...register('sex')} className="input w-full">
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.sex && <p className="text-red-500">{errors.sex.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block">Height</label>
          <input
            type="number"
            {...register('height', { valueAsNumber: true })}
            className="input w-full"
          />
          {errors.height && <p className="text-red-500">{errors.height.message}</p>}
        </div>
        <div>
          <label className="block">Unit</label>
          <select {...register('height_unit')} className="input w-full">
            <option value="cm">cm</option>
            <option value="in">in</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block">Weight</label>
          <input
            type="number"
            {...register('weight', { valueAsNumber: true })}
            className="input w-full"
          />
          {errors.weight && <p className="text-red-500">{errors.weight.message}</p>}
        </div>
        <div>
          <label className="block">Unit</label>
          <select {...register('weight_unit')} className="input w-full">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary mt-4"
      >
        Next
      </button>
    </form>
  );
}