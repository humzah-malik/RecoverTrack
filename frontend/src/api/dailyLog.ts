// src/api/dailyLog.ts
import axios from '../api/client'  // ← your configured axios instance

export interface DailyLogRequest {
  date: string
  // morning:
  sleep_start?: string
  sleep_end?: string
  sleep_quality?: number
  resting_hr?: number
  hrv?: number
  soreness?: number
  stress?: number
  motivation?: number
  water_intake_l?: number
  recovery_rating?: number

  // evening:
  trained?: boolean
  split?: string
  total_sets?: number
  failure_sets?: number
  total_rir?: number
  calories?: number
  macros?: {
    protein?: number
    carbs?: number
    fat?: number
  }
  weight?: number
  weight_unit?: string
}

export interface DailyLogResponse extends DailyLogRequest {
  id: string
  user_id: string
  recovery_rating?: number
}

export async function getDailyLog(params: { date: string }) {
    try {
      const res = await axios.get<DailyLogResponse>('/daily-log', { params })
      return res.data            // <-- found
    } catch (err: any) {
      if (err.response?.status === 404) return null  // <-- treat 404 as “no log yet”
      throw err                                     // <-- real error
    }
  }

export function upsertDailyLog(payload: DailyLogRequest) {
  return axios
    .post<DailyLogResponse>('/daily-log', payload)
    .then(res => res.data)
}