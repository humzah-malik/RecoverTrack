// src/hooks/useActivityLevels.ts
import { useQuery } from '@tanstack/react-query';
import { fetchActivityLevels } from '../api/activityLevels';

export function useActivityLevels() {
  return useQuery({
    queryKey: ['activity-levels'],
    queryFn: fetchActivityLevels,
  });
}