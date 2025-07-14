// src/hooks/useTrendsData.ts
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import dayjs, { Dayjs } from 'dayjs'

export interface RawLog {
  date:         string
  sleep_start?: string
  sleep_end?:   string
  hrv:          number
  stress:       number
  trained:      boolean
  total_sets:   number
  failure_sets: number
  macros?: { protein: number; carbs: number; fat: number }
}

export interface RecoveryPred {
  date:  string
  score: number
}

export interface DayData {
  date:          string
  sleep_h:       number
  hrv:           number
  stress:        number
  trained:       0|1
  volume:        number
  failures:      number
  protein:       number
  carbs:         number
  fat:           number
  proteinTarget: number
  carbsTarget:   number
  fatTarget:     number
}

export function useTrendsData(view: 'week'|'month', cursor: Dayjs) {
  const start = view === 'week' 
    ? cursor.startOf('week') 
    : cursor.startOf('month')
  const days = view === 'week' 
    ? 7 
    : cursor.daysInMonth()

  
  // 1️⃣ fetch the user’s macro targets
  const userQ = useQuery({
    queryKey: ['me'],
    queryFn: () => 
      client
        .get<{ macro_targets: { protein:number; carbs:number; fat:number } }>('/users/me')
        .then(r => r.data)
  })

  console.debug('userQ status:', userQ.status, userQ.data)

  // 2️⃣ fetch and normalize daily logs
  const logsQ = useQuery<DayData[]>({
    queryKey: ['dailyLogs', view, start.toString()],
    enabled: userQ.isSuccess,
    queryFn: async () => {
      const raw = (
        await client.get<RawLog[]>('/daily-log/history', {
          params: {
            start: start.format('YYYY-MM-DD'),
            days
          }
        })
      ).data

      // fall back to zeros if the user request failed
      const targets = userQ.data?.macro_targets ?? {
        protein: 0, carbs: 0, fat: 0
      }

      console.debug('[useTrendsData] raw logs:', raw)
      return raw.map(l => {
        // compute sleep_h from start/end
        let sleep_h = 0
        if (l.sleep_start && l.sleep_end) {
          const [sh, sm] = l.sleep_start.split(':').map(Number)
          const [eh, em] = l.sleep_end  .split(':').map(Number)
          sleep_h = ((eh*60 + em) - (sh*60 + sm)) / 60
          if (sleep_h < 0) sleep_h += 24
        }

        const mapped: DayData = {
          date:          l.date,
          sleep_h,
          hrv:           l.hrv,
          stress:        l.stress,
          trained:       l.trained ? 1 : 0,
          volume:        l.total_sets,
          failures:      l.failure_sets,
          protein:       l.macros?.protein ?? 0,
          carbs:         l.macros?.carbs   ?? 0,
          fat:           l.macros?.fat     ?? 0,
          proteinTarget: targets.protein,
          carbsTarget:   targets.carbs,
          fatTarget:     targets.fat
        }

        // 🔍 debug each mapped row
        console.debug('[useTrendsData]', {
          date:      l.date,
          rawMacros: l.macros,
          targets,
          mapped
        })

        return mapped
      })
    }
  })

  // 3️⃣ fetch recovery predictions
  const recQ = useQuery<RecoveryPred[]>({
    queryKey: ['recovery', view, start.toString()],
    queryFn: () => 
      client
        .get<RecoveryPred[]>('/recovery/history', {
          params: { start: start.format('YYYY-MM-DD'), days }
        })
        .then(r => r.data)
  })

  return {
    logs:      logsQ.data    ?? [],
    recs:      recQ.data     ?? [],
    isLoading: logsQ.isLoading || recQ.isLoading || userQ.isLoading,
    error:     logsQ.error    || recQ.error    || userQ.error
  }
}