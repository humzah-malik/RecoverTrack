import axios from './client';

export interface DailyLog {
  date: string;           // YYYY-MM-DD
  trained?: number;       // 1 / 0 / null
  sleep_start?: string;
  sleep_end?: string;
  sleep_quality?: number;
}

export interface RecoveryRow {
  date: string;
  score: number;
}

export async function fetchLogs(start: string, days: number) {
  const res = await axios.get<DailyLog[]>('/daily-log/history', {
    params: { start, days },
  });
  return res.data;
}

export async function fetchRecovery(start: string, days: number) {
  const res = await axios.get<RecoveryRow[]>('/recovery/history', {
    params: { start, days },
  });
  return res.data;
}