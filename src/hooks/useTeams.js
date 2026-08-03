import { useState, useEffect } from "react";
import { fetchTeams } from "../api/apiTeamsController";

const emptyPage = { page: 0, size: 12, totalElements: 0, totalPages: 0 };

const useTeams = (filters, searchInput, trackId, page = 0) => {
  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTeams({
          ...filters,
          input: searchInput,
          trackId,
          page,
          signal: controller.signal,
        });
        setTeams(data.items);
        setPagination({
          page: data.page,
          size: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Не удалось загрузить команды:", error);
        setTeams([]);
        setPagination(emptyPage);
        setError("Не удалось загрузить команды. Попробуйте ещё раз.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (trackId) {
      loadTeams();
    } else {
      setTeams([]);
      setPagination(emptyPage);
      setLoading(false);
    }

    return () => controller.abort();
  }, [filters, searchInput, trackId, page]);

  return { teams, pagination, loading, error };
};

export default useTeams;
