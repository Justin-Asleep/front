import axios, { InternalAxiosRequestConfig } from "axios";
import type { AxiosRequestConfig } from "axios";
import type { APIResponse } from "@/types/auth";

// same-origin Route Handler proxy — tokens live in httpOnly cookies only
// browser sends cookies automatically via withCredentials
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Response interceptor: 401 refresh + 에러 변환 ────────────────────────────

let isRefreshing = false;
const refreshQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // login/refresh 자체 401은 refresh 시도 없이 그대로 반환
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(toApiError(error));
    }

    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ config: originalRequest, resolve, reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post("/api/auth/refresh", null, { withCredentials: true });
        refreshQueue.forEach(({ config, resolve, reject }) => {
          apiClient(config).then(resolve).catch(reject);
        });
        refreshQueue.length = 0;
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshQueue.length = 0;
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  }
);

function toApiError(error: unknown): unknown {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && data.success === false && data.error_code) {
      return new ApiError(data.error_code, data.message ?? "Unknown error", error.response!.status);
    }
  }
  return error;
}

// ── Generic wrappers ──────────────────────────────────────────────────────────

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.get<APIResponse<T>>(url, config);
  return res.data.data as T;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.post<APIResponse<T>>(url, data, config);
  return res.data.data as T;
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.put<APIResponse<T>>(url, data, config);
  return res.data.data as T;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.patch<APIResponse<T>>(url, data, config);
  return res.data.data as T;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.delete<APIResponse<T>>(url, config);
  return res.data.data as T;
}

export default apiClient;
