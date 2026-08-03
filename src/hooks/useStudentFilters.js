import { useState, useEffect } from "react";
import { fetchStudentFilterParamsByTrackId } from "../api/apiStudentsController";

const useStudentFilters = (trackId) => {
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
        const params = await fetchStudentFilterParamsByTrackId(trackId, controller.signal);
        setFilterParams(params);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Ошибка при получении параметров фильтра:", error);
      }
    };

    if (trackId) loadFilters();
    return () => controller.abort();
  }, [trackId]);

  return filterParams;
};

export default useStudentFilters;
