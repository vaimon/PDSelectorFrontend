import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStudentById } from "../api/apiStudentsController";

/**
 * One student record, for the cabinet and for someone else's profile alike.
 *
 * A student belongs to at most one team in the current selection, so `current_team` is the whole
 * team story here; `teams` on the record is the history of previous selections and nothing reads it.
 */
const useStudentData = (studentId) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Walking from one profile to the next leaves two requests in flight, and the older answer can
  // land last: showing someone else's record would be worse than a slow one.
  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const loadId = latestLoad.current + 1;
    latestLoad.current = loadId;

    if (!studentId) {
      setStudentData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fetchedStudent = await fetchStudentById(studentId);
      if (loadId !== latestLoad.current) return;
      setStudentData(fetchedStudent);
      setError(null);
    } catch (error) {
      if (loadId !== latestLoad.current) return;
      console.error("Не удалось загрузить данные участника:", error);
      setStudentData(null);
      setError("Не удалось загрузить данные участника.");
    } finally {
      if (loadId === latestLoad.current) setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    studentData,
    currentTeam: studentData?.current_team ?? null,
    loading,
    error,
    refresh: load,
  };
};

export default useStudentData;
