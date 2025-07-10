// src/api/users.ts
import api from './client';
import type { UserOut } from './auth';

export interface UpdateProfilePayload {
  age?: number;
  sex?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  height?: number;
  weight?: number;
  height_unit?: string;
  weight_unit?: string;
  goal?: string;
  maintenance_calories?: number;
  macro_targets?: Record<string, unknown>;
  activity_level?: string;
  weight_target?: number;
  weight_target_unit?: string;
  split_template_id?: string;
}

// GET /users/me → UserOut
export function fetchProfile() {
  return api.get<UserOut>('/users/me').then(res => res.data);
}

// PATCH /users/me → UserOut
export function updateProfile(data: UpdateProfilePayload) {
  return api.patch<UserOut>('/users/me', data).then(res => res.data);
}

export function markOnboardingComplete() {
  return api.post("/users/me/complete-onboarding");
}

export async function deleteProfile(): Promise<void> {
  await api.delete("/users/me");
}

export { fetchProfile as getMe };