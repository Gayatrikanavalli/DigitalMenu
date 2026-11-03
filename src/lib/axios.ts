import axios, { AxiosInstance, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

// Resolve API base URL across Next.js and Vite environments
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    // Browser: use the same-origin /api path so the Next.js rewrite proxy
    // forwards /api/* → http://backend:8000/api/* internally. This keeps
    // session cookies same-origin (SameSite=Lax) and avoids CORS issues.
    return `${window.location.origin}/api`;
  }
  // SSR / server-side: call the backend container directly
  const envUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    (import.meta as any)?.env?.VITE_API_URL;
  return envUrl || 'http://backend:8000/api';
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

export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach the CSRF token to state-changing requests so Django's
// CsrfViewMiddleware validates the session-backed staff API calls.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toLowerCase();
  const isStateChanging =
    method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
  if (isStateChanging) {
    const token = getCookie('csrftoken');
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
