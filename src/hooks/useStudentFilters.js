import { useState, useEffect } from "react";
import { fetchStudentFilterParams } from "../api/apiStudentsController";

const useStudentFilters = (enabled = true) => {
  const [filterParams, setFilterParams] = useState({
    courses: [],
    groups: [],
    hasTeam: [],
    isCaptain: [],
    technologies: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadFilters = async () => {
      try {
        const params = await fetchStudentFilterParams(controller.signal);
        setFilterParams(params);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Ошибка при получении параметров фильтра:", error);
      }
    };

    if (enabled) loadFilters();
    return () => controller.abort();
  }, [enabled]);

  return filterParams;
};

export default useStudentFilters;
