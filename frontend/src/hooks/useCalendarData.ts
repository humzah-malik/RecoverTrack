import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { fetchLogs, fetchRecovery } from '../api/calendar'

export type DayState =
  | { state: 'scored';      score: number; trained: boolean }
  | { state: 'rest-scored'; score: number }
  | { state: 'rest' }
  | { state: 'pending' }

// Normalize trained value to boolean, covering 1, "1", true, "true", etc.
function normalizeTrained(input: unknown): boolean {
  if (typeof input === 'boolean') return input
  if (typeof input === 'number') return input === 1
  if (typeof input === 'string') return input.trim().toLowerCase() === 'true' || input.trim() === '1'
  return false
}

export function useCalendarData(view: 'week' | 'month', cursor: dayjs.Dayjs) {
  const start = view === 'week'
    ? cursor.startOf('week')
    : cursor.startOf('month')
    const days = view === 'week' ? 7 : cursor.daysInMonth()

  const { data: logs = [] } = useQuery<{ date: string; trained?: unknown; recovery_rating?: number }[]>({
    queryKey: ['logs', start.format('YYYY-MM-DD'), days],
    queryFn: () => fetchLogs(start.format('YYYY-MM-DD'), days),
  })

  const { data: recs = [] } = useQuery<{ date: string; score: number }[]>({
    queryKey: ['recs', start.format('YYYY-MM-DD'), days],
    queryFn: () => fetchRecovery(start.format('YYYY-MM-DD'), days),
  })

  const logMap = Object.fromEntries(logs.map(l => [l.date, l]))
  const recMap = Object.fromEntries(recs.map(r => [r.date, r.score]))

  const dayStates: Record<string, DayState> = {}
  for (let i = 0; i < days; i++) {
    const d   = start.add(i, 'day')
    const key = d.format('YYYY-MM-DD')
    const log = logMap[key]
    const rec = recMap[key]

    if (!log) {
      dayStates[key] = { state: 'pending' }
      continue
    }

    const isTrained = normalizeTrained(log.trained)

    if (!isTrained) {
      if (rec !== undefined) {
        dayStates[key] = { state: 'rest-scored', score: rec }
      } else {
        dayStates[key] = { state: 'rest' }
      }
      continue
    }

    // trained day
    if (rec !== undefined) {
      dayStates[key] = { state: 'scored', score: rec, trained: true }
    } else {
      const fallback = log.recovery_rating ?? 0
      dayStates[key] = { state: 'rest-scored', score: fallback }
    }
  }

  // stats for the ribbon
  const scored       = Object.values(dayStates).filter(d => d.state === 'scored' || d.state === 'rest-scored') as { score: number }[]
  const trainingDays = Object.values(dayStates).filter(d => d.state === 'scored').length
  const restDays     = Object.values(dayStates).filter(d => d.state === 'rest' || d.state === 'rest-scored').length
  const pendingDays  = Object.values(dayStates).filter(d => d.state === 'pending').length

  return {
    dayStates,
    stats: {
      average:     scored.length ? scored.reduce((sum, d) => sum + d.score, 0) / scored.length : 0,
      trainingDays,
      restDays,
      pendingDays,
    }
  }
}