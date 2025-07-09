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

/* ------------------------------------------------------------------ */
/*  Zustand store                                                     */
/* ------------------------------------------------------------------ */

interface AuthState {
  user: UserOut | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (creds: LoginPayload) => Promise<UserOut>;
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

      login: async (creds) => {
        const { access_token, refresh_token } = await apiLogin(creds);

        /* set auth header for axios instance */
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;

        /* update store & localStorage */
        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          isAuthenticated: true,
        });
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        /* fetch user profile */
        const me = await fetchMe();
        set({ user: me });
        return me;
      },

      register: async (data) => {
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
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalReq = error.config;

    // only run if we got a 401 and haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalReq.__isRetryRequest
    ) {
      const { refreshToken: rToken } = useAuth.getState();
      if (!rToken) {
        useAuth.getState().logout();
        return Promise.reject(error);
      }

      try {
        /* get new tokens using refresh token */
        const { access_token, refresh_token } = await refreshToken(rToken);

        /* save & apply new access token */
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        useAuth.setState({
          accessToken: access_token,
          refreshToken: refresh_token,
          isAuthenticated: true,
        });

        /* retry original request once */
        originalReq.__isRetryRequest = true;
        originalReq.headers.Authorization = `Bearer ${access_token}`;
        return api(originalReq);
      } catch (refreshErr) {
        // refresh failed → force logout
        useAuth.getState().logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);