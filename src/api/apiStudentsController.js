import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import apiClient from './apiClient';
import { assertSuccessfulResponse } from './authRedirect';
import { normalizePageResponse } from './normalizeResponse';

// Reads without track_id answer for the current selection (StudentService.resolveTrackId).
export const fetchStudents = async ({
  input,
  course,
  groupNumber,
  hasTeam,
  isCaptain,
  technologies,
  teamId,
  page = 0,
  size = 12,
  signal,
}) => {
  try {
    const queryParams = new URLSearchParams();

    const normalizedInput = input?.trim();
    if (normalizedInput) queryParams.append("input", normalizedInput);
    if (Array.isArray(course)) course.forEach((value) => queryParams.append("course", value));
    if (Array.isArray(groupNumber)) groupNumber.forEach((value) => queryParams.append("group_number", value));
    if (typeof hasTeam === "boolean") queryParams.append("has_team", String(hasTeam));
    if (typeof isCaptain === "boolean") queryParams.append("is_captain", String(isCaptain));
    if (technologies && technologies.length > 0) {
      technologies.forEach((tech) => queryParams.append("technologies", tech));
    }
    // One team's members (vaimon/team-selection#39) — the admin area's «by team».
    if (teamId != null) queryParams.append("team_id", String(teamId));
    queryParams.set("page", String(page));
    queryParams.set("size", String(size));


    const response = await fetch(`${API_BASE_URL}/students/search?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include",
      signal,
    });

    await assertSuccessfulResponse(response);


    const data = await response.json();
    return normalizePageResponse(data);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    console.error("Error fetching students:", error);
    throw error;
  }
};

export const fetchStudentFilterParams = async (signal) => {
  const response = await fetch(`${API_BASE_URL}/students/filters`, {
    method: 'GET',
    credentials: 'include',
    signal,
  });

  await assertSuccessfulResponse(response);
  return response.json();
};

export const fetchStudentById = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'GET',
      credentials: 'include',
    });

    await assertSuccessfulResponse(response);
    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении данных студента:", error);
    throw error;
  }
};

// Создание анкеты участника
export const createStudent = async (studentData) => {
  const response = await apiClient.post('/students', studentData);
  return response.data;
};

// Обновление анкеты участника
export const updateStudent = async (studentData, studentId) => {
  const response = await apiClient.put(`/students/${studentId}`, studentData);
  return response.data;
};

// Удаляет анкету — организатор, лишняя регистрация (#48). Уходят анкета, заявки и место в
// команде; учётная запись остаётся, человек может войти и заполнить анкету заново
// (vaimon/team-selection#38). Тимлида бэкенд не удаляет: сначала роль передают или команду
// распускают.
export const deleteStudent = async (studentId) => {
  await apiClient.delete(`/students/${studentId}`);
};


// The signed-in account: id, fio, email, role and a summary of its student record — but not the
// student id, that one only comes from getCurrentStudentId. A 401 is handled by the global axios
// interceptor installed in main.jsx.
export const fetchCurrentUser = async () => {
  const response = await axios.get(`${API_BASE_URL}/users/me`, {
    withCredentials: true,
  });
  return response.data;
};


export const getCurrentStudentId = async () => {
  const response = await axios.get(`${API_BASE_URL}/students/me`, {
    withCredentials: true,
  });
  // An account without a student record gets an empty body, which axios reports as "".
  return response.data === "" || response.data == null ? null : response.data;
};
