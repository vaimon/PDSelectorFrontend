import axios from "axios";
import { API_BASE_URL } from '../config/apiConfig';
import { assertSuccessfulResponse } from './authRedirect';

// Получение всех заявок
export const fetchApplications = async (trackId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/applications?=${trackId}`
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении заявок", error);
    throw error;
  }
};

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

// Получение заявок конкретной команды
export const fetchTeamApplications = async (teamId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/teams/${teamId}/subscriptions`
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении заявок команды:", error);
    throw error;
  }
};

export const createApplication = async (applicationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData), 
      credentials: 'include',
    });

    await assertSuccessfulResponse(response);
    return await response.json(); 
  } catch (error) {
    console.error("Ошибка при создании заявки:", error);
    throw error;
  }
};


// Удаление заявки
export const deleteApplication = async (applicationId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/applications/${applicationId}`
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при удалении заявки:", error);
    throw error;
  }
};

// Обновление заявки
export const updateApplication = async (applicationData) => {
  console.log('fff',applicationData);
  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData), 
      credentials: 'include',
    });

    await assertSuccessfulResponse(response);
    return await response.json(); 
  } catch (error) {
    console.error("Ошибка при обновлении заявки:", error);
    throw error;
  }
};
