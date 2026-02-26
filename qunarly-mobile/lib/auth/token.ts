import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'qunarly_access_token';
const REFRESH_TOKEN_KEY = 'qunarly_refresh_token';

export const saveAccessToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getAccessToken = async () => SecureStore.getItemAsync(TOKEN_KEY);

export const clearAccessToken = async () => SecureStore.deleteItemAsync(TOKEN_KEY);

export const saveRefreshToken = async (token: string) => {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = async () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const clearRefreshToken = async () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
