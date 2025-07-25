import { useState } from 'react';
import { useProfile, useSplits } from '../hooks/useProfile';
import { ProfileStep } from './Onboarding/ProfileStep';
import { GoalStep } from './Onboarding/GoalStep';
import { ReviewStep } from './Onboarding/ReviewStep';
import { SplitStep } from './Onboarding/SplitStep';
import { markOnboardingComplete } from '../api/users';
import BackgroundGradient from '../components/BackgroundGradient'

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
    <div className="max-w-md mx-auto p-6 sm:p-8 space-y-8">
      <div className="pointer-events-none absolute inset-0 z-0">
        <BackgroundGradient />
      </div>
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
          onNext={async ({ goal, activity_level, weight_target, weight_target_unit }) => {
            await updateProfile({ goal, activity_level, weight_target, weight_target_unit });
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