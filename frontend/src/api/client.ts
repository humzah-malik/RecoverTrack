import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Optionally: interceptors for auth token injection & 401 refresh

export default api;