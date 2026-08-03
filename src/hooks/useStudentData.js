import { useState, useEffect } from "react";
import { fetchStudentById } from "../api/apiStudentsController";


const useStudentData = (studentId, currentUser) => {
    const [studentData, setStudentData] = useState(null);
    const [myTeams, setMyTeams] = useState([]);
    const [createdTeams, setCreatedTeams] = useState([]);
    const [submittedRequests, setSubmittedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCurrentUser, setIsCurrentUser] = useState(false);
  

    const loadStudentData = async () => {
      if (!studentId) return;
  
      setLoading(true);
      try {
        const fetchedStudent = await fetchStudentById(studentId);
        setStudentData(fetchedStudent);
        console.log('curr',currentUser);
        console.log('st', fetchedStudent);
        if (currentUser && currentUser === fetchedStudent.id) {
          setIsCurrentUser(true);
        }
  
        setMyTeams(fetchedStudent.teams || []);
        setSubmittedRequests(fetchedStudent.applications || []);
        setCreatedTeams(fetchedStudent.current_team?[fetchedStudent.current_team]: []);
      } catch (error) {
        setError("Ошибка при загрузке данных студента.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      loadStudentData();
  
      return () => {
        setStudentData(null);
        setMyTeams([]);
        setCreatedTeams([]);
        setSubmittedRequests([]);
        setLoading(true);
        setError(null);
      };
    }, [studentId, currentUser]);
  
    const refreshStudentData = () => {
      loadStudentData(); 
    };
  
    return {
      studentData,
      myTeams,
      createdTeams,
      submittedRequests,
      loading,
      error,
      isCurrentUser,
      refreshStudentData
    };
  };
  
  export default useStudentData;
