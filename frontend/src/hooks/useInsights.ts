import { useQuery } from '@tanstack/react-query'
import client from '../api/client'

export function useInsights(view: 'week' | 'month', context: object) {
  return useQuery<string[]>({
    queryKey: ['insights', view, context],
    queryFn: async () => {
      const res = await client.post('/rules/evaluate', {
        ctx: context,
        timeframe: view === 'week' ? 'weekly' : 'monthly',
      })
      return res.data
    },
    enabled: !!context && Object.keys(context).length > 0
  })
}