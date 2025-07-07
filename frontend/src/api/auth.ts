// src/api/auth.ts
import api from './client';

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

// POST /auth/register → returns UserOut
export function register(data: RegisterPayload) {
  return api.post<UserOut>('/auth/register', data).then(res => res.data);
}

// POST /auth/login → returns tokens
export function login(data: LoginPayload) {
  return api.post<TokenResponse>('/auth/login', data).then(res => res.data);
}

// GET /auth/me → returns UserOut
export function fetchMe() {
  return api.get<UserOut>('/auth/me').then(res => res.data);
}

// POST /auth/refresh → returns tokens
export function refreshToken() {
  return api.post<TokenResponse>('/auth/refresh').then(res => res.data);
}