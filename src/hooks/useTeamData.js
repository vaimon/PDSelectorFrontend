import { useCallback, useEffect, useState } from "react";
import { fetchTeamById } from "../api/apiTeamsController";
import { useIdentity } from "../context/identityContext";

const EMPTY = {
  name: "",
  description: "",
  technologies: [],
  students: [],
  requests: [],
  project_type: null,
  captain: null,
};

const useTeamData = (teamId) => {
  const { studentId: currentStudentId } = useIdentity();
  const [teamData, setTeamData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // A refetch after an action deliberately leaves `loading` alone: replacing the roster with
  // «Загрузка…» for the duration of one request is exactly what the page is avoiding.
  const load = useCallback(async () => {
    setError(null);
    try {
      setTeamData(await fetchTeamById(teamId));
    } catch (err) {
      setError("Ошибка при загрузке данных команды.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Derived, not stored: transferring the lead role has to change the answer without a reload.
  // captain.id is a student id, so it is only ever comparable to the current student id.
  const isCaptain = currentStudentId != null && teamData.captain?.id === currentStudentId;

  return { teamData, isCaptain, loading, error, refresh: load };
};

export default useTeamData;
