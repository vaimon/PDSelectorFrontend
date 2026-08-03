import axios from "axios";

import { API_BASE_URL } from '../config/apiConfig';
import { assertSuccessfulResponse } from './authRedirect';
import { normalizePageResponse } from './normalizeResponse';

export const fetchTeams = async ({
  input,
  trackId,
  isFull,
  projectType,
  technologies,
  page = 0,
  size = 12,
  signal,
}) => {
  try {
    const queryParams = new URLSearchParams();

    const normalizedInput = input?.trim();
    if (normalizedInput) queryParams.append("input", normalizedInput);
    if (trackId) queryParams.append("track_id", trackId);
    if (typeof isFull === "boolean") queryParams.append("is_full", String(isFull));
    if (Array.isArray(projectType)) {
      projectType.forEach((typeName) => queryParams.append("project_type", typeName));
    }
    if (technologies && technologies.length > 0) {
      technologies.forEach((techId) => queryParams.append("technologies", techId));
    }
    queryParams.set("page", String(page));
    queryParams.set("size", String(size));

    const response = await fetch(`${API_BASE_URL}/teams/search?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include",
      signal,
    });

    await assertSuccessfulResponse(response);
    const data = await response.json();
    return normalizePageResponse(data);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    console.error("Ошибка при получении данных команд:", error);
    throw error;
  }
};



// Получение данных о командах
export const fetchTeamById = async (teamId) => {
  console.log('id team',teamId);
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: 'GET',
        credentials: 'include', 
      });

      await assertSuccessfulResponse(response);
      return response.json();
    } catch (error) {
      console.error("Ошибка при получении данных команды:", error);
      throw error;
    }
  };

  // Получение данных о фильтре
export const fetchFilterParamsByTrackId = async (trackId, signal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/filters?track_id=${trackId}`, {
        method: 'GET',
        credentials: 'include',
        signal,
      });

      await assertSuccessfulResponse(response);
      return response.json();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      console.error("Ошибка при получении данных:", error);
      throw error;
    }
  };

  export const createTeam = async (teamData) => {
    console.log('sent', teamData);
    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData), 
        credentials: "include", 
      });

      await assertSuccessfulResponse(response);
  
      return response.json();
    } catch (error) {
      console.error("Ошибка при создании команды:", error);
      throw error;
    }
  };
  
  

// Получение данных о командах
export const deleteTeam = async (teamId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/teams/${teamId}`);
      return response.data;
    } catch (error) {
      console.error("Ошибка при удалении команды:", error);
      throw error;
    }
  };

  //добавление существующего студента к команде
  export const addStudentToTeam = async (teamId, studentId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/teams/${teamId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error("Ошибка при добавлении студента к команде:", error);
      throw error;
    }
  };

  // Создание новой команды
  export const updateTeam = async (teamData, teamId) => {
    try {
     
      console.log("Отправляемые данные команды:", teamData);
  
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',  
        },
        body: JSON.stringify(teamData), 
        credentials: 'include', 
    });

    if (response.status === 401) {
      await assertSuccessfulResponse(response);
    }

    if (!response.ok) {
        const errorText = await response.text(); 
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
      }
  
      return await response.json(); 
    } catch (error) {
      console.error("Ошибка при обновлении команды:", error);
      throw error;
    }
  };
