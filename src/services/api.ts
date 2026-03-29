import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ||
  'https://dollarpoint-4.onrender.com/api/v1';

// ── Token storage ─────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:  () => AsyncStorage.getItem('dpx_access'),
  getRefresh: () => AsyncStorage.getItem('dpx_refresh'),
  setTokens:  async (a: string, r: string) => {
    await AsyncStorage.setItem('dpx_access', a);
    await AsyncStorage.setItem('dpx_refresh', r);
  },
  clear: async () => {
    await AsyncStorage.removeItem('dpx_access');
    await AsyncStorage.removeItem('dpx_refresh');
  },
};

// ── Axios instance ────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Refresh queue ─────────────────────────────────────────────────────────────
let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];
let onForceLogout: (() => void) | null = null;
export const setLogoutListener = (fn: () => void) => { onForceLogout = fn; };
const drain = (err: unknown, token: string | null) => {
  queue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(err)));
  queue = [];
};

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); });
      }
      orig._retry = true;
      refreshing  = true;
      const refresh = await tokenStorage.getRefresh();
      if (!refresh) { await tokenStorage.clear(); onForceLogout?.(); return Promise.reject(error); }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
        const newAccess: string = data.access_token || data.access;
        await tokenStorage.setTokens(newAccess, refresh);
        drain(null, newAccess);
        orig.headers.Authorization = `Bearer ${newAccess}`;
        return api(orig);
      } catch (e) {
        drain(e, null); await tokenStorage.clear(); onForceLogout?.(); return Promise.reject(e);
      } finally { refreshing = false; }
    }
    return Promise.reject(error);
  }
);

// ── Convierte cualquier valor a string plano ──────────────────────────────────
const toStr = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return toStr(val[0]);
  if (typeof val === 'object') {
    const v = val as Record<string, unknown>;
    if (v.msg)     return String(v.msg);
    if (v.message) return String(v.message);
    if (v.detail)  return String(v.detail);
    const first = Object.values(v)[0];
    if (first) return toStr(first);
  }
  return 'Error desconocido';
};

// ── parseApiError — siempre retorna string ────────────────────────────────────
export const parseApiError = (err: unknown): string => {
  if (!axios.isAxiosError(err)) return 'Error inesperado. Intenta de nuevo.';
  const d = err.response?.data;
  if (!d) return 'Sin conexión. Verifica tu internet.';
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return toStr(d[0]);
  if (d.detail !== undefined) return toStr(d.detail);
  if (d.message) return String(d.message);
  if (d.non_field_errors) return toStr(d.non_field_errors);
  if (d.error) return String(d.error);
  for (const key of Object.keys(d)) {
    const s = toStr(d[key]);
    if (s) return `${key}: ${s}`;
  }
  return 'Error al procesar la solicitud.';
};
