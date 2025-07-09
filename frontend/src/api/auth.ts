import api from './client';
import rawAuthClient from './rawAuthClient';   // ⬅️ no interceptors attached
export interface UserOut {
  id: string;
  email: string;
  age: number | null;
  sex: string | null;
  height: number | null;
  weight: number | null;
  height_unit: string | null;
  weight_unit: string | null;
  goal: string | null;
  maintenance_calories: number | null;
  macro_targets: Record<string, unknown> | null;
  activity_level: string | null;
  weight_target: number | null;
  weight_target_unit: string | null;
  split_template_id: string | null;
  has_completed_onboarding?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export function register(data: RegisterPayload) {
  return api.post<UserOut>('/auth/register', data).then((r) => r.data);
}

export function login(data: LoginPayload) {
  return api.post<TokenResponse>('/auth/login', data).then((r) => r.data);
}

export function fetchMe() {
  return api.get<UserOut>('/auth/me').then((r) => r.data);
}

export function refreshToken(refresh_token: string) {
  return rawAuthClient
    .post<TokenResponse>(
      '/auth/refresh',
      null,
      { headers: { Authorization: `Bearer ${refresh_token}` } }
    )
    .then((r) => r.data);
}