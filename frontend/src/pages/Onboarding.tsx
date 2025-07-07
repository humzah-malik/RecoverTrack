// src/pages/Onboarding.tsx
import { useState } from 'react'
import { useProfile, useSplits } from '../hooks/useProfile'
import { ProfileStep } from './Onboarding/ProfileStep'
import { GoalStep } from './Onboarding/GoalStep'
import { ReviewStep } from './Onboarding/ReviewStep'
import { SplitStep } from './Onboarding/SplitStep'
import { markOnboardingComplete } from '../api/users';

export default function Onboarding() {
  const { profile, isLoading, updateProfile } = useProfile()
  const { data: splits } = useSplits()
  const [step, setStep] = useState(0)

  if (isLoading) return <p>Loading…</p>

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      {/* STEP 0: Profile */}
      {step === 0 && (
        <ProfileStep
          defaultValues={profile || {}}
          onNext={async (data) => {
            await updateProfile(data)
            setStep(1)
          }}
        />
      )}

      {/* STEP 1: Goal & Activity */}
      {step === 1 && (
        <GoalStep
          defaultValues={profile || {}}
          onNext={async ({ goal, activity_level }) => {
            await updateProfile({ goal, activity_level })
            setStep(2)
          }}
        />
      )}

      {/* STEP 2: Review & Edit Calories/Macros */}
      {step === 2 && profile && (
        <ReviewStep
          profile={profile}
          onNext={async (data) => {
            await updateProfile(data)
            setStep(3)
          }}
        />
      )}

      {/* STEP 3: Choose or Create Split */}
      {step === 3 && (
        <SplitStep
          splits={splits || []}
          defaultSplitId={profile?.split_template_id || ''}
          onNext={async (data) => {
            await updateProfile(data)
            await markOnboardingComplete();
            window.location.href = '/dashboard'
          }}
        />
      )}
    </div>
  )
}