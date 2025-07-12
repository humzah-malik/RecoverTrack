// src/hooks/useDailyDigest.ts
import { useQuery } from '@tanstack/react-query';
import { fetchDailyDigest } from '../api/digests';
import dayjs from 'dayjs';

export function useDailyDigest(date?: string) {
  const iso = date ?? dayjs().format('YYYY-MM-DD');
  return useQuery({
    queryKey: ['daily-digest', iso],
    queryFn : () => fetchDailyDigest(date),
  });
}