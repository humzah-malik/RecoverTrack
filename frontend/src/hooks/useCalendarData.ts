import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchLogs, fetchRecovery } from '../api/calendar';

export type DayState =
  | { state: 'scored'; score: number; trained: boolean }
  | { state: 'rest-scored'; score: number }
  | { state: 'rest' }
  | { state: 'pending' };

export function useCalendarData(view: 'week' | 'month', cursor: dayjs.Dayjs) {
  const start = view === 'week'
    ? cursor.startOf('week')
    : cursor.startOf('month');

  const days = view === 'week' ? 7 : 30;

  const { data: logs = [] } = useQuery({
    queryKey: ['logs', start.format(), days],
    queryFn: () => fetchLogs(start.format('YYYY-MM-DD'), days),
  });

  const { data: recs = [] } = useQuery({
    queryKey: ['recovery', start.format(), days],
    queryFn: () => fetchRecovery(start.format('YYYY-MM-DD'), days),
  });

  const logMap = Object.fromEntries(logs.map(l => [l.date, l]));
  const recMap = Object.fromEntries(recs.map(r => [r.date, r.score]));

  const dayStates: Record<string, DayState> = {};
  for (let i = 0; i < days; i++) {
    const d = start.add(i, 'day');
    const key = d.format('YYYY-MM-DD');
    const log = logMap[key];
    const score = recMap[key];

    if (!log) {
      dayStates[key] = { state: 'pending' };
    } else if (log.trained !== 1) {
        if (score !== undefined) {
                  dayStates[key] = { state: 'rest-scored', score };
                } else {
                  dayStates[key] = { state: 'rest' };
                }
    } else if (
      log.sleep_start && log.sleep_end && log.sleep_quality !== undefined && score !== undefined
    ) {
      dayStates[key] = { state: 'scored', score, trained: true };
    } else {
      dayStates[key] = { state: 'pending' }; // missing minimal morning
    }
  }

  // stats for the ribbon
  const scored = Object.values(dayStates).filter(
      d => d.state === 'scored' || d.state === 'rest-scored'
    ) as { score: number }[];
  const trainingDays = Object.values(dayStates)
    .filter(d => d.state === 'scored').length;

  const restDays = Object.values(dayStates)
    .filter(d => d.state === 'rest' || d.state === 'rest-scored').length;

  const pendingDays = Object.values(dayStates)
    .filter(d => d.state === 'pending').length;

  return {
    dayStates,
    stats: {
      average: scored.length ? scored.reduce((s, d) => s + d.score, 0) / scored.length : 0,
      trainingDays,
      restDays,
      pendingDays,
    },
  };
}