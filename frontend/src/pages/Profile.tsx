import { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { getMe, updateProfile as updateProfileApi, deleteProfile as deleteProfileApi} from "../api/users"; 
import type { UserOut } from "../api/auth";
import { Avatar } from '../components/Avatar';
import { CameraIcon } from '@heroicons/react/24/outline';
import React, { useRef } from 'react'
import { uploadAvatar } from '../api/uploadAvatar'
import { useProfile } from '../hooks/useProfile'
import { useSplits } from '../hooks/useProfile';
import { useActivityLevels } from '../hooks/useActivityLevels';

export default function Profile() {
  const qc = useQueryClient();
  const { profile, updateProfile } = useProfile()        // replace your existing useProfile
  const fileInputRef = useRef<HTMLInputElement>(null)
  // banner message
  const [success, setSuccess] = useState<string|null>(null);

  // delete‑confirmation modal state must be up here, before any returns:
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const openDelete  = () => setIsDeleteOpen(true);
  const closeDelete = () => setIsDeleteOpen(false);
  const { data: splitOptions = [] } = useSplits();
  const { data: activityLevels = [] } = useActivityLevels();

  const { data: user, isLoading, isError } = useQuery<UserOut>({
    queryKey: ['me'],
    queryFn: getMe,
  });
  const [form, setForm] = useState<Partial<UserOut>>({});
  const updateMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['me'] });
            setSuccess("Profile updated successfully");
            setTimeout(() => setSuccess(null), 3000);
          },
  });

  const deleteMutation = useMutation({
        mutationFn: () => deleteProfileApi(),
        onSuccess: () => {
          window.location.href = "/dashboard";
        },
    });

  const onFieldChange = (field: keyof UserOut) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    const raw = e.target.value;
    const val = e.target.type === 'number' ? +raw : raw;
    setForm(prev => ({ ...prev, [field]: val }));
  };

  // 2) handler just for macros
  const onMacroChange = (key:'protein'|'carbs'|'fat') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value;
    setForm(prev => ({
      ...prev,
      macro_targets: {
        ...(prev.macro_targets ?? user!.macro_targets)!,
        [key]: isNaN(v)?0:v
      }
    }));
  };

  const onAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const url = await uploadAvatar(e.target.files[0])
    // persist change everywhere
    await updateProfile({ avatar_url: url })
  }

  if (isLoading) return <div>Loading...</div>;
  if (isError || !user) return <div className="text-red-600">Failed to load user info.</div>;

  // merge server data + local edits
  const merged = { ...user, ...form };

  return (
    <>
    {success && (
       <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
         {success}
       </div>
     )}
      {/* Header Card */}
      <div className="bg-white border rounded-lg p-6 flex items-center gap-6">
        <Avatar user={merged} size={6} className="w-16 h-16" />
        <div>
          <h2 className="text-xl font-semibold">{merged.first_name} {merged.last_name}</h2>
          <p className="text-gray-500">{merged.email}</p>
          <>
            <button
              onClick={onAvatarClick}
              className="mt-2 p-1.5 bg-gray-100 rounded-md text-sm flex items-center gap-1"
            >
              <CameraIcon className="w-4 h-4"/> Edit
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={onFileChange}
            />
          </>
        </div>
      </div>

      {/* Personal Information */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
          <label className="block text-sm font-medium">
            Age
          </label>
            <input
              type="number"
              value={merged.age}
              onChange={onFieldChange('age')}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Sex</label>
            <select
              value={merged.sex}
              onChange={onFieldChange('sex')}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Height</label>
            <input
              type="number"
              value={merged.height}
              onChange={onFieldChange('height')}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
             <label className="block text-sm font-medium">Unit</label>
             <select
               value={merged.height_unit}
               onChange={onFieldChange('height_unit')}
               className="mt-1 block w-full border rounded p-2"
             >
               <option value="cm">cm</option>
               <option value="in">in</option>
             </select>
           </div>
          <div>
            <label className="block text-sm font-medium">
              Weight
            </label>
            <input
              type="number"
              value={merged.weight}
              onChange={onFieldChange('weight')}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
             <label className="block text-sm font-medium">Unit</label>
             <select
               value={merged.weight_unit}
               onChange={onFieldChange('weight_unit')}
               className="mt-1 block w-full border rounded p-2"
             >
               <option value="kg">kg</option>
               <option value="lb">lb</option>
             </select>
           </div>

           {/* Activity Level */}
           <div>
            <label className="block text-sm font-medium">Activity Level</label>
            <select
              value={merged.activity_level ?? ''}
              onChange={onFieldChange('activity_level')}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="">– select –</option>
              {activityLevels.map(level => (
                <option key={level} value={level}>
                  {level[0].toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium">Current Split</label>
              <select
                value={merged.split_template_id ?? ''}
                onChange={onFieldChange('split_template_id')}
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="">– select –</option>
                {splitOptions.map(split => (
                  <option key={split.id} value={split.id}>
                    {split.name}
                  </option>
                ))}
              </select>
            </div>
        </div>
      </section>

      {/* Goals */}
      <section className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium">Goals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Goal</label>
            <select
              value={merged.goal}
              onChange={onFieldChange('goal')}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="gain muscle">Gain Muscle</option>
              <option value="maintenance">Maintenance</option>
              <option value="fat loss">Fat Loss</option>
              <option value="weight loss">Weight Loss</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Calories</label>
            <input
              type="number"
              value={merged.maintenance_calories}
              onChange={onFieldChange('maintenance_calories')}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Target Weight */}
         <div className="sm:col-span-2 grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium">
               Target Weight
             </label>
             <input
               type="number"
               value={merged.weight_target ?? ''}
               onChange={onFieldChange('weight_target')}
               className="mt-1 block w-full border rounded p-2"
             />
           </div>
           <div>
             <label className="block text-sm font-medium">Unit</label>
             <select
               value={merged.weight_target_unit}
               onChange={onFieldChange('weight_target_unit')}
               className="mt-1 block w-full border rounded p-2"
             >
               <option value="kg">kg</option>
               <option value="lb">lb</option>
             </select>
           </div>
         </div>

            {/* Macro Targets */}
            <div className="sm:col-span-2 grid grid-cols-3 gap-4">
              {['protein','carbs','fat'].map(k => (
                <div key={k}>
                  <label className="block text-sm font-medium">
                    {k[0].toUpperCase()+k.slice(1)}
                  </label>
                  <input
                    type="number"
                    value={(merged.macro_targets as any)[k]}
                    onChange={onMacroChange(k as any)}
                    className="mt-1 block w-full border rounded p-2"
                  />
                </div>
              ))}
            </div>
        </div>
      </section>

      <section className="bg-white border rounded-lg p-6 my-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Member Since
          </label>
          <input
            type="text"
            disabled
            value={new Date(user.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Logs
          </label>
          <input
            type="number"
            disabled
            value={user.total_logs}
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900"
          />
        </div>

        {/* Span full width on small screens, two‑col card ends here */}
        <div className="sm:col-span-2 mt-6 space-y-2">
          <button
            // FIXME: hook up your reset‐password logic here later
            className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Reset Password
          </button>
          <button
            onClick={openDelete}
            disabled={deleteMutation.isLoading}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </section>

      <Dialog
        open={isDeleteOpen}
        onClose={closeDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will <strong>permanently</strong> delete your account.
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Cancel</Button>
          <Button
            onClick={() => { deleteMutation.mutate(); closeDelete(); }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}