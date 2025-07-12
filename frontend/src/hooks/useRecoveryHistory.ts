// src/hooks/useRecoveryHistory.ts
import { useQuery } from "@tanstack/react-query"
import api from "../api/client"

export function useRecoveryHistory(days = 30) {
  return useQuery({
    queryKey: ["recovery-history", days],
    queryFn: () =>
      api
        .get(`/recovery/history`, { params: { days } })
        .then(res => res.data as { user_id: string; date: string; score: number }[]),
  })
}