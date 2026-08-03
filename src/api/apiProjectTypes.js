import { API_BASE_URL } from '../config/apiConfig';
import { assertSuccessfulResponse } from './authRedirect';

export const fetchProjectTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projectTypes`, {
        method: "GET",
        credentials: "include",
      });
  
      await assertSuccessfulResponse(response);
      const data = await response.json();  
      return data;
    } catch (error) {
      console.error("Ошибка при получении типов проектов:", error);
      throw error;
    }
  };
