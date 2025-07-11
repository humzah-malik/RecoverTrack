// src/api/logout.ts
export function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/auth/login';  // full redirect to force reload
  }  