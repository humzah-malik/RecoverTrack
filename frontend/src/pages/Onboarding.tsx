import { useState } from 'react';
import { useProfile, useSplits } from '../hooks/useProfile';
import { ProfileStep } from './Onboarding/ProfileStep';
import { GoalStep } from './Onboarding/GoalStep';
import { ReviewStep } from './Onboarding/ReviewStep';
import { SplitStep } from './Onboarding/SplitStep';
import { markOnboardingComplete } from '../api/users';

export default function Onboarding() {
  const { profile, isLoading, updateProfile } = useProfile();
  const { data: splits } = useSplits();
  const [step, setStep] = useState(0);

  if (isLoading) return <p>Loading…</p>;

  function nullsToUndefined<T extends object>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
    ) as T;
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      {/* ─── Step 0 : Profile ───────────────────────── */}
      {step === 0 && (
        <ProfileStep
          defaultValues={nullsToUndefined(profile || {})}
          onNext={() => setStep(1)}
        />
      )}

      {/* ─── Step 1 : Goal & Activity ──────────────── */}
      {step === 1 && (
        <GoalStep
          defaultValues={profile || {}}
          onPrev={() => setStep(0)}
          onNext={async ({ goal, activity_level }) => {
            await updateProfile({ goal, activity_level });
            setStep(2);
          }}
        />
      )}

      {/* ─── Step 2 : Review ───────────────────────── */}
      {step === 2 && profile && (
        <ReviewStep
          profile={profile}
          onPrev={() => setStep(1)}
          onNext={async (data) => {
            await updateProfile(data);
            setStep(3);
          }}
        />
      )}

      {/* ─── Step 3 : Split ────────────────────────── */}
      {step === 3 && (
        <SplitStep
          splits={splits || []}
          defaultSplitId={profile?.split_template_id || ''}
          onPrev={() => setStep(2)}
          onNext={async (data) => {
            await updateProfile(data);
            await markOnboardingComplete();
            window.location.href = '/dashboard';
          }}
        />
      )}
    </div>
  );
}