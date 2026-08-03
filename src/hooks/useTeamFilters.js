import { useState, useEffect } from "react";
import { fetchFilterParamsByTrackId } from "../api/apiTeamsController";

const useTeamFilters = (trackId) => {
  const [filterParams, setFilterParams] = useState({ projectTypes: [], technologies: [] });

  useEffect(() => {
    const controller = new AbortController();

    const loadFilters = async () => {
      try {
        const params = await fetchFilterParamsByTrackId(trackId, controller.signal);
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

export default useTeamFilters;
