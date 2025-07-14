// src/api/calendar.ts
import axios from './client';

export interface DailyLog {
  date: string;           // YYYY-MM-DD
  trained?: number;
  sleep_start?: string;
  sleep_end?: string;
  sleep_quality?: number;
  recovery_rating?: number;
}

export interface RecoveryRow {
  date: string;
  score: number;
}

/**
 * Now sends both `start` and `days`, so the server can filter properly.
 */
export async function fetchLogs(start: string, days: number): Promise<DailyLog[]> {
  const res = await axios.get<DailyLog[]>('/daily-log/history', {
    params: { start, days },
  });
  return res.data;
}

export async function fetchRecovery(start: string, days: number): Promise<RecoveryRow[]> {
  const res = await axios.get<RecoveryRow[]>('/recovery/history', {
    params: { start, days },
  });
  return res.data;
}