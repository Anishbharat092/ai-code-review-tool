import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ accessToken: string }>("/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (
      (originalRequest as InternalAxiosRequestConfig & { _retry?: boolean })
        ._retry
    ) {
      useAuthStore.getState().setAccessToken(null);
      return Promise.reject(error);
    }

    (
      originalRequest as InternalAxiosRequestConfig & { _retry?: boolean }
    )._retry = true;

    const accessToken = await refreshAccessToken();

    if (!accessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

    return api(originalRequest);
  },
);

export default api;
