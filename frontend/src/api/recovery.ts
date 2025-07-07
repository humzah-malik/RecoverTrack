import api from './client';

export function fetchLogs() {
  return api.get('/logs?range=today,yesterday').then(res => res.data);
}

export function postDailyLog(data: DailyLogPayload) {
  return api.post('/daily-log', data).then(res => res.data);
}