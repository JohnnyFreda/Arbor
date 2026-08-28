import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Use relative path to leverage Vite proxy (avoids CORS issues)
// The proxy in vite.config.ts forwards /api to the backend (ARBOR_API_PORT,
// default 8420)
// If VITE_API_URL is set to a full URL, use it directly (for production)
const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = API_BASE ? `${API_BASE}/api/v1` : '/api/v1';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
  // The demo API runs on a free tier that spins down when idle; a cold start
  // can take ~60s. A short timeout here surfaces as a misleading "backend is
  // not running" error, so allow enough headroom for the wake-up.
  timeout: 90000,
});

/**
 * Wake the API without blocking the UI.
 *
 * Free-tier hosting spins the service down after inactivity. Calling this as
 * early as possible means the cold start overlaps with the user reading the
 * page instead of beginning when they click. Safe to call more than once.
 */
let warmUpStarted = false;

export const warmUpApi = (): void => {
  if (warmUpStarted) return;
  warmUpStarted = true;
  const base = API_BASE || '';
  void fetch(`${base}/health`, { method: 'GET', mode: 'cors' }).catch(() => {
    // Best-effort only: a failure here just means the first real request pays
    // the cold-start cost, which the timeout above already accommodates.
  });
};

/**
 * The message worth showing a user, pulled out of whatever was thrown.
 *
 * Prefers the API's own `detail`, then the error's message, then the caller's
 * fallback. Narrows with axios's own type guard rather than reaching into an
 * `any`, so a thrown string or a non-axios Error cannot crash the handler.
 */
export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};

/** True when a request failed because it timed out rather than being refused. */
export const isTimeoutError = (error: unknown): boolean => {
  const e = error as { code?: string; message?: string };
  return e?.code === 'ECONNABORTED' || /timeout/i.test(e?.message ?? '');
};

// Store access token in memory
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  console.log('Token set:', token ? `Yes (length: ${token.length})` : 'No (null)');
};

export const getAccessToken = () => accessToken;

// Request interceptor: add access token to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      if (config.url?.includes('/auth/me')) {
        console.log('Sending /auth/me request with token in header');
      }
    } else {
      // Log when we don't have a token (for debugging)
      if (config.url?.includes('/auth/me')) {
        console.warn('Request to /auth/me without access token - token is null');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log errors for debugging
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }

    // Don't try to refresh token for auth endpoints (login, register, refresh, me)
    // /auth/me is expected to fail on first load when user is not authenticated
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/refresh') ||
                           originalRequest.url?.includes('/auth/me');

    // Handle 401 or 403 (403 can happen when no token is provided)
    const isUnauthorized = error.response?.status === 401 || error.response?.status === 403;
    
    // Only try to refresh if:
    // 1. We have an access token stored (meaning user was logged in)
    // 2. It's not an auth endpoint
    // 3. We haven't already tried to refresh
    const shouldTryRefresh = isUnauthorized && 
                             !originalRequest._retry && 
                             !isAuthEndpoint &&
                             accessToken !== null; // Only refresh if we had a token
    
    if (shouldTryRefresh) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        // Use apiClient to leverage proxy and maintain consistency
        const response = await apiClient.post('/auth/refresh', {});
        const { access_token } = response.data;
        setAccessToken(access_token);
        processQueue(null, access_token);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        setAccessToken(null);
        // Only redirect to login if we're not already on login/register page
        // This prevents infinite reload loops
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For auth endpoints that fail (like /auth/me on first load), just reject without redirect
    return Promise.reject(error);
  }
);

