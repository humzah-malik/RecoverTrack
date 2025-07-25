// src/api/client.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000",
});

// Inject token from localStorage or sessionStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  console.log("Token sent:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;