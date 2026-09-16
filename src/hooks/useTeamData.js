import { useState, useEffect } from "react";
import { fetchTeamById } from "../api/apiTeamsController";
import { useIdentity } from "../context/identityContext";
const useTeamData = (teamId) => {
  const { studentId: currentStudentId } = useIdentity();
  const [teamData, setTeamData] = useState({
    name: "",
    description: "",
    technologies: [],
    students: [],
    requests: [],
    project_type: null,
    captainName: null,
    isCaptain: false,
  });
  const [isCaptain, setIsCaptain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      try {
        const fetchedTeam = await fetchTeamById(teamId);
        // captain.id is a student id, so it is only ever comparable to the current student id.
        setIsCaptain(currentStudentId != null && fetchedTeam.captain.id === currentStudentId);
        setTeamData(fetchedTeam);
      } catch (err) {
        setError("Ошибка при загрузке данных команды.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [teamId, currentStudentId]);

  return { teamData, isCaptain, loading, error };
};

export default useTeamData;

