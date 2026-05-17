/**
 * Lumiere AI — Axios API Client
 * Base URL, JWT interceptor, auto-logout on 401
 */
import axios from 'axios';
import { store } from '../store/store.js';
import { logout } from '../store/authSlice.js';
import { getStoredToken } from './tokenStorage.js';

// Lấy link backend từ VITE_BE_BASE_URL, mặc định fallback về localhost:3000
const API_BASE_URL = import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request interceptor: attach JWT token ──────────────────
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle auth errors ───────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sync Redux state with the invalid token
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
