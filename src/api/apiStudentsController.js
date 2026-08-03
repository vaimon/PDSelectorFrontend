import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { assertSuccessfulResponse } from './authRedirect';
import { normalizeCollectionResponse } from './normalizeResponse';
export const fetchStudents = async ({ input, trackId, course, groupNumber, hasTeam, technologies }) => {
  try {
    const queryParams = new URLSearchParams();

    if (input) queryParams.append("input", input);
    if (trackId) queryParams.append("track_id", trackId);
    if (course) queryParams.append("course", course);
    if (groupNumber) queryParams.append("group_number", groupNumber);
    if (hasTeam !== undefined) queryParams.append("has_team", hasTeam);
    if (technologies && technologies.length > 0) {
      technologies.forEach((tech) => queryParams.append("technologies", tech));
    }


    const response = await fetch(`${API_BASE_URL}/students/search?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    await assertSuccessfulResponse(response);


    const data = await response.json();
    console.log(data);
    return normalizeCollectionResponse(data);
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error; 
  }
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



  
