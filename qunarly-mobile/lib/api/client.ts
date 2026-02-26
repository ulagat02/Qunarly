import axios from 'axios';
import Constants from 'expo-constants';
import { clearAccessToken, clearRefreshToken, getAccessToken, getRefreshToken, saveAccessToken, saveRefreshToken } from '@/lib/auth/token';
import { Platform } from 'react-native';

const resolveHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    // Legacy manifest shape
    (Constants.manifest as any)?.hostUri ||
    (Constants.manifest as any)?.extra?.expoClient?.hostUri ||
    '';
  if (!hostUri) return null;
  const normalized = hostUri.replace(/^(exp|https?):\/\//, '').split('/')[0];
  const host = normalized.split(':')[0];
  return host || null;
};

const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  const hostFromExpo = resolveHostFromExpo();
  const fallbackHost = Platform.OS === 'web' ? 'localhost' : hostFromExpo;
  const host = process.env.EXPO_PUBLIC_API_HOST || hostFromExpo || fallbackHost;
  const port = process.env.EXPO_PUBLIC_API_PORT || '3000';
  return `http://${host}:${port}`;
};

export const API_BASE_URL = resolveApiBaseUrl();
const DEBUG_API = __DEV__;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const getBodyFields = (data: any) => {
  if (!data) return [];
  if (typeof data === 'object' && Array.isArray((data as any)?._parts)) {
    return (data as any)._parts.map((part: any[]) => part[0]);
  }
  if (typeof data === 'object') {
    return Object.keys(data);
  }
  return [];
};

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (DEBUG_API) {
    const method = (config.method || 'GET').toUpperCase();
    const url = `${config.baseURL || ''}${config.url || ''}`;
    const fields = getBodyFields(config.data);
    const hasAuth = Boolean(config.headers?.Authorization);
    console.log('[API]', method, url, {
      hasAuth,
      fields,
    });
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (DEBUG_API) {
      const method = (response.config.method || 'GET').toUpperCase();
      const url = `${response.config.baseURL || ''}${response.config.url || ''}`;
      console.log('[API RESPONSE]', response.status, method, url, response.data);
    }
    return response;
  },
  async (error) => {
    if (DEBUG_API) {
      const status = error?.response?.status;
      const method = (error?.config?.method || 'GET').toUpperCase();
      const url = `${error?.config?.baseURL || ''}${error?.config?.url || ''}`;
      console.log('[API ERROR]', status, method, url, error?.response?.data ?? error?.message);
    }
    const status = error?.response?.status;
    const originalRequest = error?.config;
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearAccessToken();
        await clearRefreshToken();
        return Promise.reject(error);
      }
      try {
        const refreshResponse = await refreshApi.post('/auth/refresh', { refreshToken });
        const newAccessToken = refreshResponse.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.refreshToken;
        if (!newAccessToken) {
          throw new Error('Refresh token missing');
        }
        await saveAccessToken(newAccessToken);
        if (newRefreshToken) {
          await saveRefreshToken(newRefreshToken);
        }
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearAccessToken();
        await clearRefreshToken();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
