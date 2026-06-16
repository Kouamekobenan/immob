import axios from 'axios';

const BASE_URL = "https://immob-api-charist-production.up.railway.app/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject access token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh queue
let isRefreshing = false;
let queue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => queue.push({ resolve, reject })).then(
        (token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        },
      );
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        null,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      sessionStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      queue.forEach((p) => p.resolve(data.accessToken));
      queue = [];

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (err) {
      queue.forEach((p) => p.reject(err));
      queue = [];
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(' • ');
    if (typeof msg === 'string') return msg;
  }
  return 'Une erreur est survenue';
}
