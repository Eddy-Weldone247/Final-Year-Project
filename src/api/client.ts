import axios from 'axios';

import { config } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';

/** Shared Axios instance pre-configured with the API base URL. */
export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the bearer token (if any) to every request.
apiClient.interceptors.request.use((requestConfig) => {
  const { token } = useAuthStore.getState();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

// Clear auth on 401 so the UI can redirect to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);
