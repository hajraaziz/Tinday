/* eslint-disable @typescript-eslint/no-require-imports */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { AuthResponse } from "@/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
}

const api = axios.create({
  baseURL: apiUrl,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// Request interceptor: attach Bearer token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { useAuthStore } = require("@/store/authStore");
  const { access_token } = useAuthStore.getState();
  if (access_token) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { useAuthStore } = require("@/store/authStore");
      const { refresh_token, setAuth } = useAuthStore.getState();

      if (!refresh_token) {
        throw new Error("No refresh token available");
      }

      const { data } = await axios.post<AuthResponse>(
        `${apiUrl}/api/auth/refresh`,
        { refresh_token }
      );

      setAuth(data);

      const newAccessToken = data.session.access_token;
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      const { useAuthStore } =
        require("@/store/authStore") as typeof import("@/store/authStore");
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Typed wrappers
export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>
) {
  const { data } = await api.get<T>(url, { params });
  return data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: { headers?: Record<string, string> }
) {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function apiPut<T>(url: string, body?: unknown) {
  const { data } = await api.put<T>(url, body);
  return data;
}

export async function apiDelete<T>(url: string) {
  const { data } = await api.delete<T>(url);
  return data;
}

export { api };
export default api;
