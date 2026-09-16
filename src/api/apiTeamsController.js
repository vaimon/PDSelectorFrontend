import { API_BASE_URL } from '../config/apiConfig';
import apiClient from './apiClient';
import { assertSuccessfulResponse } from './authRedirect';
import { normalizePageResponse } from './normalizeResponse';

// Reads without track_id answer for the current selection (TeamService.resolveTrackId), so the
// client never has to know which track that is.
export const fetchTeams = async ({
  input,
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
export const fetchTeamFilterParams = async (signal) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/filters`, {
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

// Создание команды
export const createTeam = async (teamData) => {
  const response = await apiClient.post('/teams', teamData);
  return response.data;
};

// Обновление команды
export const updateTeam = async (teamData, teamId) => {
  const response = await apiClient.put(`/teams/${teamId}`, teamData);
  return response.data;
};
