import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { redirectToLogin } from './authRedirect';
import { notifyError } from '../context/notificationContext';

/**
 * One client for every mutation.
 *
 * It carries the session cookie and adds the `X-XSRF-TOKEN` header from the cookie Spring Security
 * hands out (vaimon/team-selection#11) — harmless while CSRF is still off, required the moment it
 * is on. `withXSRFToken` is needed because local dev talks to the backend cross-origin, and axios
 * would otherwise attach the header only for same-origin requests.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

const STATUS_MESSAGES = {
  400: 'Сервер не принял данные. Проверьте форму и попробуйте снова.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Данные не найдены — возможно, их уже удалили.',
  409: 'Действие конфликтует с текущим состоянием данных.',
};

const messageOf = (error) => {
  const { response } = error;

  if (!response) {
    return 'Сервер недоступен. Проверьте соединение и попробуйте снова.';
  }

  // Handled backend errors carry {timestamp, status, error, message, path}; everything else falls
  // back to a phrase by status, because a raw stack trace is not a message for a student.
  const message = response.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  return STATUS_MESSAGES[response.status] ?? `Ошибка сервера (${response.status}).`;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // Reads have their own empty states and expected 404s; a failed mutation is the one the user
    // has to hear about, because they just asked for it to happen.
    if (error.config?.method && error.config.method.toLowerCase() !== 'get') {
      notifyError(messageOf(error));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
