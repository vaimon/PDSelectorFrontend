import { useState, useEffect } from "react";
import { fetchStudents } from "../api/apiStudentsController";

const emptyPage = { page: 0, size: 12, totalElements: 0, totalPages: 0 };

const useStudents = (filters, searchInput, trackId, page = 0) => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStudents({
          ...filters,
          input: searchInput,
          trackId,
          page,
          signal: controller.signal,
        });
        setStudents(data.items);
        setPagination({
          page: data.page,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Не удалось загрузить студентов:", error);
        setStudents([]);
        setPagination(emptyPage);
        setError("Не удалось загрузить участников. Попробуйте ещё раз.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (trackId) {
      loadStudents();
    } else {
      setStudents([]);
      setPagination(emptyPage);
      setLoading(false);
    }

    return () => controller.abort();
  }, [filters, searchInput, trackId, page]);

  return { students, pagination, loading, error };
};

export default useStudents;
