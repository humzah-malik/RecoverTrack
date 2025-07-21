import { Fragment, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { getMe, updateProfile as updateProfileApi, deleteProfile as deleteProfileApi } from "../api/users";
import type { UserOut } from "../api/auth";
import { Avatar } from '../components/Avatar';
import { CameraIcon } from '@heroicons/react/24/outline';
import { uploadAvatar } from '../api/uploadAvatar';
import { useProfile } from '../hooks/useProfile';
import { useSplits } from '../hooks/useProfile';
import { useActivityLevels } from '../hooks/useActivityLevels';

export default function Profile() {
  const qc = useQueryClient();
  const { profile, updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const openDelete = () => setIsDeleteOpen(true);
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

  const onFieldChange = (field: keyof UserOut) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = e.target.value;
    const val = e.target.type === 'number' ? +raw : raw;
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const onMacroChange = (key: 'protein' | 'carbs' | 'fat') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value;
    setForm(prev => ({
      ...prev,
      macro_targets: {
        ...(prev.macro_targets ?? user!.macro_targets)!,
        [key]: isNaN(v) ? 0 : v
      }
    }));
  };

  const onAvatarClick = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const url = await uploadAvatar(e.target.files[0]);
    await updateProfile({ avatar_url: url });
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !user) return <div className="text-red-500">Failed to load user info.</div>;

  const merged = { ...user, ...form };

  return (
    <>
      {success && (
        <div className="mb-4 px-4 py-3 rounded text-sm text-green-900 bg-green-100 border border-green-300">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="card-glow hoverable mb-6">
        <div className="card-base p-6 flex items-center gap-6">
          <Avatar user={merged} size={6} className="w-16 h-16" />
          <div>
            <h2 className="text-xl font-semibold">{merged.first_name} {merged.last_name}</h2>
            <p className="text-muted">{merged.email}</p>
            <button
              onClick={onAvatarClick}
              className="mt-2 btn btn-secondary text-sm"
            >
              <CameraIcon className="w-4 h-4 mr-1" /> Edit
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={onFileChange}
            />
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card-glow hoverable mb-6">
        <section className="card-base p-6 space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Age" type="number" value={merged.age ?? ''} onChange={onFieldChange('age')} />
            <Select label="Sex" value={merged.sex ?? ''} onChange={onFieldChange('sex')} options={['male', 'female']} />
            <Input label="Height" type="number" value={merged.height ?? ''} onChange={onFieldChange('height')} />
            <Select label="Unit" value={merged.height_unit ?? ''} onChange={onFieldChange('height_unit')} options={['cm', 'in']} />
            <Input label="Weight" type="number" value={merged.weight ?? ''} onChange={onFieldChange('weight')} />
            <Select label="Unit" value={merged.weight_unit ?? ''} onChange={onFieldChange('weight_unit')} options={['kg', 'lb']} />
            <Select label="Activity Level" value={merged.activity_level ?? ''} onChange={onFieldChange('activity_level')} options={activityLevels} />
            <Select label="Current Split" value={merged.split_template_id ?? ''} onChange={onFieldChange('split_template_id')} options={splitOptions.map(s => ({ label: s.name, value: s.id }))} />
          </div>
        </section>
      </div>

      {/* Goals */}
      <div className="card-glow hoverable mb-6">
        <section className="card-base p-6 space-y-4">
          <h3 className="text-lg font-semibold">Goals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Goal" value={merged.goal} onChange={onFieldChange('goal')} options={['gain muscle', 'maintenance', 'fat loss', 'weight loss']} />
            <Input label="Calories" type="number" value={merged.maintenance_calories} onChange={onFieldChange('maintenance_calories')} />
            <div className="sm:col-span-2 grid grid-cols-2 gap-4">
              <Input label="Target Weight" type="number" value={merged.weight_target ?? ''} onChange={onFieldChange('weight_target')} />
              <Select label="Unit" value={merged.weight_target_unit} onChange={onFieldChange('weight_target_unit')} options={['kg', 'lb']} />
            </div>
            <div className="sm:col-span-2 grid grid-cols-3 gap-4">
              {['protein', 'carbs', 'fat'].map(k => (
                <Input key={k} label={k[0].toUpperCase() + k.slice(1)} type="number" value={(merged.macro_targets as any)?.[k]} onChange={onMacroChange(k as any)} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Membership Info & Buttons */}
      <div className="card-glow hoverable mb-8">
        <section className="card-base p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input label="Member Since" value={new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} disabled />
          <Input label="Total Logs" value={user.total_logs} disabled />
          <div className="sm:col-span-2 mt-4 space-y-2">
            <button
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isLoading}
              className="btn btn-primary w-full"
            >
              Update Profile
            </button>
            <button
              onClick={openDelete}
              disabled={deleteMutation.isLoading}
              className="btn btn-danger w-full"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will <strong>permanently</strong> delete your account. Are you sure you want to proceed?
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

// ─────────────────────────────────────────────
// Reusable Input & Select Components
function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input {...props} className="input w-full" />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: (string | { label: string; value: string | number })[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select value={value} onChange={onChange} className="input w-full">
        <option value="">– select –</option>
        {options.map(opt => {
          const label = typeof opt === 'string' ? opt[0].toUpperCase() + opt.slice(1) : opt.label;
          const val = typeof opt === 'string' ? opt : opt.value;
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
    </div>
  );
}