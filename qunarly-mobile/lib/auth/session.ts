import { Buffer } from 'buffer';
import { getAccessToken, saveAccessToken, saveRefreshToken } from './token';
import * as SecureStore from 'expo-secure-store';

const ROLE_KEY = 'qunarly_user_role';

type Session = {
  userId: string | null;
  role: string | null;
};

const decodeJwt = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded) as { sub?: string; role?: string };
  } catch {
    return {};
  }
};

export const getSession = async (): Promise<Session> => {
  const token = await getAccessToken();
  if (!token) {
    return { userId: null, role: null };
  }
  const payload = decodeJwt(token);
  const storedRole = await SecureStore.getItemAsync(ROLE_KEY);
  return {
    userId: payload.sub ?? null,
    role: payload.role ?? storedRole ?? null,
  };
};

export const storeSessionFromToken = async (token: string, refreshToken?: string) => {
  const payload = decodeJwt(token);
  if (payload.role) {
    await SecureStore.setItemAsync(ROLE_KEY, payload.role);
  }
  await saveAccessToken(token);
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }
};
