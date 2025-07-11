// src/hooks/useSplitSessions.ts
import { useQuery } from '@tanstack/react-query'
import { useProfile } from './useProfile'
import api from '../api/client'

interface Session { id:string; name:string; muscle_groups:string[] }

export function useSplitSessions() {
  const { profile } = useProfile()
  const tplId = profile?.split_template_id        // ⇐ might be null!

  /* quick debug */
  console.log('[useSplitSessions] tplId from profile:', tplId)

  return useQuery<Session[]>({
    queryKey: ['split-sessions', tplId],
    enabled: !!tplId,                            // hook won’t fire if falsy
    queryFn: async () => {
      if (!tplId) return []

      /* Network debug */
      console.log('[useSplitSessions] fetching /splits/' + tplId)

      try {
        const { data } = await api.get(`/splits/${tplId}`)
        console.log('[useSplitSessions] response:', data)
        return Array.isArray(data?.sessions) ? data.sessions : []
      } catch (err: any) {
        console.error('[useSplitSessions] request failed:', err.response?.status, err.response?.data)
        return []          // still return an array so React-Query is happy
      }
    },
    staleTime: 5 * 60_000,
    placeholderData: [],   // guarantees array on first render
  })
}