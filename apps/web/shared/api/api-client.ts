import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth-store';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Wait for Zustand persist hydration before making API calls
const waitForHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });

    // 5 second timeout for graceful degradation
    setTimeout(() => {
      unsub();
      resolve();
    }, 5000);
  });
};

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Wait for hydration then add authorization header
apiClient.interceptors.request.use(
  async (config) => {
    await waitForHydration();
    const { accessToken } = useAuthStore.getState();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Client] Request to:', config.url);
      console.log('[API Client] Has token:', !!accessToken);
      console.log('[API Client] Token preview:', accessToken?.substring(0, 20) + '...');
    }
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 and refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
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
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, clearTokens, setTokens } = useAuthStore.getState();

      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${baseURL}/users/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
