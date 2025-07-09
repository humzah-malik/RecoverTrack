// src/pages/Onboarding/ProfileStep.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';

/* ─── helpers ─────────────────────────────────────────────── */
function pastelFromName(name = '') {
  if (!name) return '#E5E7EB'; 
  const hue = (name.charCodeAt(0) * 37) % 360;
  return `hsl(${hue} 70% 90%)`;
}

/* ─── schema ──────────────────────────────────────────────── */
const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name:  z.string().min(1, 'Required'),
  avatar_file: z
    .any()
    .optional()
    .transform((v) => {
      if (!v || !(v as FileList).length) return undefined;
      return (v as FileList)[0] as File;
    }),

  age: z.coerce.number().min(1, 'Age must be positive'),
  sex: z.enum(['male', 'female']),
  height: z.number().min(0, 'Required'),
  height_unit: z.enum(['cm', 'in']),
  weight: z.number().min(0, 'Required'),
  weight_unit: z.enum(['kg', 'lb']),
});
export type ProfileData = z.infer<typeof schema>;

interface Props {
  defaultValues: Partial<ProfileData>;
  onNext: (data: ProfileData) => void;
}

/* ─── component ───────────────────────────────────────────── */
export function ProfileStep({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const firstName = watch('first_name');

  return (
    <div className="max-w-md mx-auto">
      {/* progress ------------------------------------------------ */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2 px-1">
          <span>Step&nbsp;1&nbsp;of&nbsp;4</span>
          <span>Physical&nbsp;Profile</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded">
          <div className="h-full w-1/4 bg-gray-900 rounded" />
        </div>
      </div>

      {/* card ---------------------------------------------------- */}
      <form
        onSubmit={handleSubmit(onNext)}
        className="space-y-6 bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-8 shadow-sm"
      >
        {/* heading */}
        <div>
          <h2 className="text-2xl font-semibold mb-1">Tell us about yourself</h2>
          <p className="text-gray-500">Your basic physical stats</p>
        </div>

        {/* avatar + names -------------------------------------- */}
        <div className="flex flex-col items-center gap-4">
          {/* avatar */}
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold text-gray-700"
            style={{ background: pastelFromName(firstName) }}
          >
            {firstName?.charAt(0)?.toUpperCase() || 'A'}

            {/* edit overlay */}
            <label
            htmlFor="avatar"
            className="absolute bottom-0 right-0 w-7 h-7
                        rounded-full bg-black text-white shadow-md
                        flex items-center justify-center cursor-pointer
                        ring-2 ring-white dark:ring-gray-900
                        transition duration-150 ease-in-out hover:bg-gray-800"
            >
            <i className="fas fa-pen" style={{ fontSize: '0.65rem' }} />
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              {...register('avatar_file')}
              className="hidden"
            />
          </div>

          {/* first / last name */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input {...register('first_name')} className="input w-full bg-gray-50/80 border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/20" />
              {errors.first_name && (
                <p className="text-red-500 text-xs">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input {...register('last_name')} className="input w-full bg-gray-50/80 border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/20" />
              {errors.last_name && (
                <p className="text-red-500 text-xs">{errors.last_name.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* divider */}
        <hr className="my-6 border-gray-200" />

        {/* age */}
        <div>
          <label className="block text-sm font-medium mb-1">Age</label>
          <input
            type="number"
            {...register('age', { valueAsNumber: true })}
            className="input w-full bg-gray-50/80 border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/20"
          />
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
        </div>

        {/* sex */}
        <fieldset>
          <legend className="block text-sm font-medium mb-1">Sex</legend>
          <div className="flex gap-6">
            {(['male', 'female'] as const).map((s) => (
              <label key={s} className="inline-flex items-center gap-1.5 text-sm">
                <input type="radio" value={s} {...register('sex')} className="radio" />
                <span className="capitalize">{s}</span>
              </label>
            ))}
          </div>
          {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex.message}</p>}
        </fieldset>

        {/* height */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Height</label>
            <input
              type="number"
              {...register('height', { valueAsNumber: true })}
              className="input w-full bg-gray-50/80 border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/20"
            />
            {errors.height && (
              <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select {...register('height_unit')} className="input w-full bg-gray-50/80 border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/20">
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        </div>

        {/* weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Weight</label>
            <input
              type="number"
              {...register('weight', { valueAsNumber: true })}
              className="input w-full bg-gray-50/80 border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/20"
            />
            {errors.weight && (
              <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select {...register('weight_unit')} className="input w-full bg-gray-50/80 border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/20">
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>

        {/* next button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            Next&nbsp;Step →
          </button>
        </div>
      </form>
    </div>
  );
}