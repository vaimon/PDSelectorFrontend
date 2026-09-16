import { useState, useEffect } from "react";
import { fetchTeams } from "../api/apiTeamsController";

const emptyPage = { page: 0, size: 12, totalElements: 0, totalPages: 0 };

// `enabled` is false while identity is loading and between selections: the catalogue answers for
// the current selection, and there is nothing to ask for when none is running.
const useTeams = (filters, searchInput, page = 0, enabled = true) => {
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

    if (enabled) {
      loadTeams();
    } else {
      setTeams([]);
      setPagination(emptyPage);
      setLoading(false);
    }

    return () => controller.abort();
  }, [filters, searchInput, page, enabled]);

  return { teams, pagination, loading, error };
};

export default useTeams;
