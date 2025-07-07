// src/api/splits.ts
import api from './client';

export interface SplitSessionIn {
  id: string;
  name: string;
  muscle_groups: string[];
}
export interface SplitTemplateIn {
  name: string;
  type: string;
  sessions: SplitSessionIn[];
}

export interface SplitSessionOut extends SplitSessionIn {}
export interface SplitTemplateOut {
  id: string;
  name: string;
  type: string;
  is_preset: number;
  sessions: SplitSessionOut[];
}

// GET /splits/
export function fetchSplits() {
  return api.get<SplitTemplateOut[]>('/splits/').then(res => res.data);
}