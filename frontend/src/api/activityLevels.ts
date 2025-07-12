// src/api/activityLevels.ts
import api from './client';

export function fetchActivityLevels(): Promise<string[]> {
  return api.get('/meta/activity-levels').then(res => res.data);
}