import { API_BASE_URL } from '../config/apiConfig';
import { assertSuccessfulResponse } from './authRedirect';

export const fetchTechnologies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/technologies`, {
        method: "GET",
        credentials: "include",
      });

      await assertSuccessfulResponse(response);
      console.log('response', response);
      const data = await response.json();
      console.log('data',data);

      return data;
    } catch (error) {
      console.error("Ошибка при получении технологий:", error);
      throw error;
    }
  };
