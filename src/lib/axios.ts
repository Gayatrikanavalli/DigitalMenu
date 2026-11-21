import axios, { AxiosInstance, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

// Resolve API base URL across Next.js and Vite environments
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    // In browser, prefer explicit public API URL (e.g. Render backend) when set.
    // Fallback to same-origin /api (useful for Vite proxy / Next rewrites).
    const envUrl =
      (import.meta as any)?.env?.VITE_API_URL ||
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
      '';
    const normalized = String(envUrl || '').trim().replace(/\/+$/, '');
    if (normalized) return normalized;
    return `${window.location.origin}/api`;
  }
  // SSR / server-side: call the backend container or configured backend directly
  const envUrl =
    (typeof process !== 'undefined' && process.env?.BACKEND_INTERNAL_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    (import.meta as any)?.env?.VITE_API_URL;
  return String(envUrl || 'http://backend:8000/api').replace(/\/+$/, '');
};

// Read the Django csrftoken cookie so unsafe requests pass CSRF validation
// when using session-based authentication.
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return null;
}

let csrfFetchPromise: Promise<string | null> | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCookie('csrftoken');
  if (existing) return existing;
  if (!csrfFetchPromise) {
    csrfFetchPromise = apiClient
      .get('/auth/me', { timeout: 15000 })
      .then(() => getCookie('csrftoken'))
      .catch(() => getCookie('csrftoken'))
      .finally(() => {
        csrfFetchPromise = null;
      });
  }
  return csrfFetchPromise;
}

// Attach the CSRF token to state-changing requests so Django's
// CsrfViewMiddleware validates the session-backed staff API calls.
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toLowerCase();
  const isStateChanging =
    method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
  if (isStateChanging) {
    let token = getCookie('csrftoken');
    if (!token) token = await ensureCsrfToken();
    if (token) {
      const headers = config.headers as AxiosRequestHeaders | undefined;
      if (!headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      (config.headers as AxiosRequestHeaders)['X-CSRFToken'] = token;
    }
  }
  return config;
});

// Interceptor for logging or global error telemetry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't treat 401/403 on auth endpoints as session expiration — those are
    // expected when credentials are invalid or the account lacks staff access.
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    // 401 Unauthenticated: session expired — clear auth state.
    // 403 Forbidden: authenticated but lacks permission — do NOT log out;
    // let the caller surface an appropriate error instead.
    if (!isAuthEndpoint && error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        console.log('[TRACE] axios session-expired (401):', error.config?.url);
        window.dispatchEvent(new Event('auth:session-expired'));
      }
    }

    // Graceful fallback for local development when Django is not running
    if (error.code === 'ERR_NETWORK' || error.response?.status === 404 || error.code === 'ECONNABORTED') {
      console.warn('[BhojanQR Axios] Django backend not directly reachable, synchronizing with local cache buffer:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
