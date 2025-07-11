// src/components/RecoveryScoreDisplay.tsx
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProfile } from '../hooks/useProfile'
import { getRecovery } from '../api/recovery'
import type { RecoveryResponse } from '../api/recovery'

type RecoveryDebugResponse = RecoveryResponse & { ctx?: any; model_input?: any };

interface Props {
  /** YYYY-MM-DD, used only for caching/refetch */
  date: string
}

export default function RecoveryScoreDisplay({ date }: Props) {
  const { profile } = useProfile()

  const { data, isLoading, isError } = useQuery<RecoveryDebugResponse | null, Error>({
    queryKey: ['recovery', date],
    queryFn: () => getRecovery({ user_id: profile!.id, date }),
    enabled: Boolean(profile?.id && date),
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (import.meta.env.DEV && data?.ctx) {
        console.groupCollapsed('🛠️ recovery debug ctx')
        console.table(data.ctx)
        console.groupEnd()
      }

  if (isLoading || isError || data?.predicted_recovery_rating == null) {
    return (
      <>
        <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
          <span className="text-2xl font-extrabold">--</span>
        </div>
        <p className="font-semibold mb-1">No recovery score yet</p>
        <p className="text-gray-500 text-xs">Complete at least one daily log</p>
      </>
    )
  }

  const score = Math.round(data.predicted_recovery_rating)
  return (
    <>
      <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
        <span className="text-2xl font-extrabold">{score}</span>
      </div>
      <p className="font-semibold mb-1">Recovery Score</p>
    </>
  )
}