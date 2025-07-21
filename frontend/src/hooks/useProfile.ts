// src/hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, type UpdateProfilePayload } from '../api/users';
import { fetchSplits } from '../api/splits';

export function useProfile() {
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const updateMut = useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateProfile(data),
    onSuccess: updated => {
      qc.setQueryData(['profile'], updated);
    },
  });

  return {
    profile: profileQ.data,
    isLoading: profileQ.isLoading,
    isError: profileQ.isError,
    updateProfile: updateMut.mutateAsync,
    updateStatus: {
      isLoading: updateMut.status === "pending",
      isError: updateMut.isError,
    },
  };
}

export function useSplits() {
  return useQuery({
    queryKey: ['splits'],
    queryFn: fetchSplits,
  });
}