import axios from 'axios';

import { rememberJoin } from '../utils/pendingJoin';

let isRedirectingToLogin = false;
let axiosInterceptorInstalled = false;

export const redirectToLogin = () => {
  if (window.location.pathname === '/login' || isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  // A join link opened signed out has to lead back to the invitation once the person is in.
  rememberJoin(window.location.pathname);
  window.location.replace('/login');
};

export const assertSuccessfulResponse = async (response) => {
  if (response.status === 401) {
    redirectToLogin();
    throw new Error('Требуется авторизация');
  }

  if (!response.ok) {
    throw new Error(`Ошибка HTTP: ${response.status}`);
  }

  return response;
};

export const installAxiosAuthRedirect = () => {
  if (axiosInterceptorInstalled) {
    return;
  }

  axiosInterceptorInstalled = true;
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        redirectToLogin();
      }

      return Promise.reject(error);
    },
  );
};
