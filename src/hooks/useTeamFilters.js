import { useState, useEffect } from "react";
import { fetchTeamFilterParams } from "../api/apiTeamsController";

const useTeamFilters = (enabled = true) => {
  const [filterParams, setFilterParams] = useState({ projectTypes: [], technologies: [] });

  useEffect(() => {
    const controller = new AbortController();

    const loadFilters = async () => {
      try {
        const params = await fetchTeamFilterParams(controller.signal);
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

export default useTeamFilters;
