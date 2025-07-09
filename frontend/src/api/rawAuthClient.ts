// src/api/rawAuthClient.ts
import axios from 'axios';

const rawAuthClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
});

export default rawAuthClient;