// src/components/DailyLog.tsx
import { useMutation, useQuery } from '@tanstack/react-query'
import { getDailyLog, upsertDailyLog } from '../api/dailyLog'
import { useProfile } from '../hooks/useProfile'

export function useDailyLog(date: string) {
  const { profile } = useProfile()

  return useQuery({
    queryKey: ['daily-log', date],
    queryFn: () => getDailyLog({ date }),
    enabled: !!profile && !!date,
    refetchOnWindowFocus: false,
  })
}

export function useUpsertDailyLog() {
  return useMutation({
    mutationFn: upsertDailyLog,
  })
}