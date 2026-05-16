/**
 * Cliente HTTP compartilhado.
 *
 * Espelha o APIClient do iOS / OkHttp do Android:
 *   - Adiciona Authorization: Bearer <access> automaticamente
 *   - Em 401, tenta refresh UMA vez; se falhar, força logout
 *   - Usa o BASE_URL do .env (.env.development → localhost; .env.production → prod)
 *
 * O AuthStore (zustand) é importado dinamicamente pra quebrar ciclo:
 *   client.ts → authStore → (talvez chame login que usa o client)
 */

import axios, { AxiosError, AxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

// --------------- Helpers de token sem dependência circular ---------------
let accessGetter: () => string | null = () => null;
let refreshGetter: () => string | null = () => null;
let onTokenRefreshed: (newAccess: string) => void = () => {};
let onAuthFailed: () => void = () => {};

export function configureAuth(opts: {
  getAccess: () => string | null;
  getRefresh: () => string | null;
  onAccessUpdated: (newAccess: string) => void;
  onAuthFailed: () => void;
}) {
  accessGetter = opts.getAccess;
  refreshGetter = opts.getRefresh;
  onTokenRefreshed = opts.onAccessUpdated;
  onAuthFailed = opts.onAuthFailed;
}

// --------------- Interceptor de request: anexa Bearer ---------------
api.interceptors.request.use((config) => {
  // Endpoints públicos (login/refresh/register) podem mandar `_skipAuth`.
  if ((config as AxiosRequestConfigWithMeta)._skipAuth) return config;
  const token = accessGetter();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

interface AxiosRequestConfigWithMeta extends AxiosRequestConfig {
  _skipAuth?: boolean;
  _isRetry?: boolean;
}

// --------------- Interceptor de response: refresh em 401 ---------------
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfigWithMeta | undefined;
    const status = error.response?.status;

    if (
      !original ||
      status !== 401 ||
      original._isRetry ||
      original._skipAuth
    ) {
      return Promise.reject(error);
    }

    // Coalesce concurrent 401s into a single refresh attempt.
    refreshPromise =
      refreshPromise ??
      (async () => {
        const refresh = refreshGetter();
        if (!refresh) return null;
        try {
          const resp = await axios.post(
            `${BASE_URL}/api/auth/refresh/`,
            { refresh },
            { headers: { "Content-Type": "application/json" }, timeout: 15_000 },
          );
          const newAccess = resp.data?.access as string | undefined;
          if (!newAccess) return null;
          onTokenRefreshed(newAccess);
          return newAccess;
        } catch {
          return null;
        }
      })();

    const newAccess = await refreshPromise;
    refreshPromise = null;

    if (!newAccess) {
      onAuthFailed();
      return Promise.reject(error);
    }

    original._isRetry = true;
    original.headers = original.headers ?? {};
    original.headers["Authorization"] = `Bearer ${newAccess}`;
    return api.request(original);
  },
);

/** Helper pra chamadas que não devem ter Bearer (login, refresh, register). */
export function publicRequest<T = unknown>(config: AxiosRequestConfig) {
  return api.request<T>({
    ...config,
    _skipAuth: true,
  } as AxiosRequestConfigWithMeta);
}
