import axios from 'axios';

let isRedirectingToLogin = false;
let axiosInterceptorInstalled = false;

export const redirectToLogin = () => {
  if (window.location.pathname === '/login' || isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
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
