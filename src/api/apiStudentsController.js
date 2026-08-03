import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { assertSuccessfulResponse } from './authRedirect';
import { normalizePageResponse } from './normalizeResponse';
export const fetchStudents = async ({
  input,
  trackId,
  course,
  groupNumber,
  hasTeam,
  isCaptain,
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
    if (Array.isArray(course)) course.forEach((value) => queryParams.append("course", value));
    if (Array.isArray(groupNumber)) groupNumber.forEach((value) => queryParams.append("group_number", value));
    if (typeof hasTeam === "boolean") queryParams.append("has_team", String(hasTeam));
    if (typeof isCaptain === "boolean") queryParams.append("is_captain", String(isCaptain));
    if (technologies && technologies.length > 0) {
      technologies.forEach((tech) => queryParams.append("technologies", tech));
    }
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

export const fetchStudentFilterParamsByTrackId = async (trackId, signal) => {
  const queryParams = new URLSearchParams({ track_id: String(trackId) });
  const response = await fetch(`${API_BASE_URL}/students/filters?${queryParams}`, {
    method: 'GET',
    credentials: 'include',
    signal,
  });

  await assertSuccessfulResponse(response);
  return response.json();
};

export const createStudent = async (trackId, studentData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/students?trackId=${trackId}`, studentData);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании студента:', error);
      throw error;
    }
  };


export const deleteStudent = async (studentId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error("Ошибка при удалении команды:", error);
      throw error;
    }
  };


export const fetchStudentById = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'GET',
      credentials: 'include', 
    });

    await assertSuccessfulResponse(response);
    const data = await response.json(); 
    console.log('data', data);
    console.log(data);
    return data;
  } catch (error) {
    console.error("Ошибка при получении данных студента:", error);
    throw error;
  }
};

// Обновление заявки
export const updateStudent = async (studentData, studentId) => {
  try {
   
    console.log("Отправляемые данные студента:", studentData);

    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',  
      },
      body: JSON.stringify(studentData), 
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
    console.error("Ошибка при обновлении студента:", error);
    throw error;
  }
};


export const fetchCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me`, {
      withCredentials: true, 
    });
    return response.data.id;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login';
    } else {
      console.error("Error fetching user ID:", error);
      throw error;
    }
  }
};


export const getCurrentStudentId = async () => {
  const response = await axios.get(`${API_BASE_URL}/students/me`, {
    withCredentials: true,
  });
  return response.data;
};



  
