import { API_BASE_URL } from '../config/apiConfig';
import apiClient from './apiClient';
import { assertSuccessfulResponse } from './authRedirect';

// Получение данных о конкретной заявке
export const fetchApplicationById = async (applicationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    await assertSuccessfulResponse(response);
    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении заявки:", error);
    throw error;
  }
};

// Создание заявки
export const createApplication = async (applicationData) => {
  const response = await apiClient.post('/applications', applicationData);
  return response.data;
};

// Обновление заявки
export const updateApplication = async (applicationData) => {
  const response = await apiClient.put('/applications', applicationData);
  return response.data;
};
