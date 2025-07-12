// src/api/digests.ts
import api from './client';

export interface DailyDigest {
  date: string;
  alerts: string[];
  micro_tips: string[];
}

export function fetchDailyDigest(date?: string) {
  const params = date ? { day: date } : {};
  return api.get<DailyDigest>('/digests/daily', { params }).then(r => r.data);
}