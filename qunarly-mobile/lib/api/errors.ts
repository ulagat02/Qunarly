import axios from 'axios';

export type ApiErrorKind =
  | 'offline'
  | 'timeout'
  | 'server'
  | 'auth'
  | 'validation'
  | 'payloadTooLarge'
  | 'unknown';

export type ApiErrorInfo = {
  kind: ApiErrorKind;
  status?: number;
  message: string;
};

const toMessage = (data: any) => {
  const message = data?.message ?? data?.error ?? data;
  if (Array.isArray(message)) {
    return message.join('\n');
  }
  if (typeof message === 'string') {
    return message;
  }
  return 'Белгісіз қате.';
};

export const parseApiError = (error: any): ApiErrorInfo => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return { kind: 'timeout', message: 'Уақыт бітті. Кейінірек қайталап көріңіз.' };
    }
    if (!error.response) {
      return { kind: 'offline', message: 'Интернет жоқ немесе серверге қосылу мүмкін емес.' };
    }
    const status = error.response.status;
    const message = toMessage(error.response.data);
    if (status === 401 || status === 403) {
      return { kind: 'auth', status, message: 'Авторизация қажет. Қайта кіріңіз.' };
    }
    if (status === 413) {
      return { kind: 'payloadTooLarge', status, message: 'Сурет тым үлкен.' };
    }
    if (status === 400 || status === 422) {
      return { kind: 'validation', status, message };
    }
    if (status >= 500) {
      return { kind: 'server', status, message: 'Сервер қатесі. Кейінірек қайталап көріңіз.' };
    }
    return { kind: 'unknown', status, message };
  }
  return { kind: 'unknown', message: 'Белгісіз қате.' };
};
