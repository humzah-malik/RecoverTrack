// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  login as apiLogin,
  register as apiRegister,
  fetchMe,
  refreshToken,
  type LoginPayload,
  type RegisterPayload,
  type UserOut,
} from '../api/auth';
import api from '../api/client';

interface AuthState {
  user: UserOut | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (creds: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async creds => {
        const { access_token, refresh_token } = await apiLogin(creds);
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          isAuthenticated: true,
        });
        const me = await fetchMe();
        set({ user: me });
      },

      register: async data => {
        await apiRegister(data);
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        delete api.defaults.headers.common.Authorization;
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      partialize: state => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// interceptor to auto-refresh tokens
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      const store = useAuth.getState();
      if (store.refreshToken) {
        const { access_token, refresh_token } = await refreshToken();
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        setTimeout(() => window.location.reload(), 0);
        useAuth.setState({ accessToken: access_token, refreshToken: refresh_token });
      }
    }
    return Promise.reject(err);
  }
);