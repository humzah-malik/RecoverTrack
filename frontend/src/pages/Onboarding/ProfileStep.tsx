// src/pages/Onboarding/ProfileStep.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { uploadAvatar } from '../../api/uploadAvatar';
import { useProfile } from '../../hooks/useProfile';
import { pastelFromName } from '../../utils/pastelFromName';

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

  const avatarList = watch('avatar_file') as FileList | undefined;
  const [preview, setPreview] = useState<string|undefined>(undefined);

    useEffect(() => {
  // grab the first File out of the FileList, if any
  const file = avatarList && avatarList.length > 0 ? avatarList[0] : undefined;
  if (file) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }
  setPreview(undefined);
}, [avatarList]);

  const { updateProfile } = useProfile();
  const submit = async (data: ProfileData) => {
      let avatar_url: string | undefined;
    
      if (data.avatar_file) {
        avatar_url = await uploadAvatar(data.avatar_file);
      }
    
      const { avatar_file, _, ...rest } = data;
      try {
        await updateProfile({ ...rest, avatar_url });
        onNext({} as any);                      // advance to next step
      } catch (err: any) {
        // 👇 this is the line that prints FastAPI’s 422 details
        console.error(err.response?.data);
        toast.error("Profile update failed");
      }
      onNext({} as any);
    };

  const firstName = watch('first_name');

  return (
    <div className="max-w-md mx-auto">
      {/* progress ------------------------------------------------ */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2 px-1">
          <span>Step&nbsp;1&nbsp;of&nbsp;4</span>
          <span>Physical&nbsp;Profile</span>
        </div>
        <div className="h-2 w-full bg-[var(--border)] rounded">
          <div className="h-full w-1/4 bg-[var(--accent)] rounded" />
        </div>
      </div>

      {/* card ---------------------------------------------------- */}
      <form
        onSubmit={handleSubmit(submit)}
        className="hoverable card-base p-6 sm:p-8 space-y-6"
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
            {preview ? (
            <img
                src={preview}
                alt="avatar preview"
                className="w-full h-full rounded-full object-cover"
            />
            ) : (
            firstName?.charAt(0)?.toUpperCase() || 'A'
            )}

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
              <input {...register('first_name')} className="input w-full" />
              {errors.first_name && (
                <p className="text-red-500 text-xs">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input {...register('last_name')} className="input w-full" />
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
            className="input w-full"
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
              className="input w-full"
            />
            {errors.height && (
              <p className="text-red-500 text-xs mt-1">{errors.height.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select {...register('height_unit')} className="input w-full">
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
              className="input w-full"
            />
            {errors.weight && (
              <p className="text-red-500 text-xs mt-1">{errors.weight.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select {...register('weight_unit')} className="input w-full">
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
          className="btn btn-dark"
        >
          Next Step →
        </button>
        </div>
      </form>
    </div>
  );
}