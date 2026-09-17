import { useState } from 'react';
import { createTeam } from '../api/apiTeamsController';
import { useIdentity } from '../context/identityContext';
import { useNotifications } from '../context/notificationContext';

const EMPTY_TEAM = {
  name: "",
  projectDescription: "",
  projectType: null,
  technologies: [],
};

// A team is always created by the signed-in student, in the selection that is currently open —
// neither of those is the caller's to choose, and the backend ignores a track sent from here.
export const useNewTeam = (technologies, projectTypes) => {
  const { studentId } = useIdentity();
  const { notify } = useNotifications();
  const [newTeam, setNewTeam] = useState(EMPTY_TEAM);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' && name === 'technologies') {
      const selectedTech = technologies.find((tech) => tech.id.toString() === value);
      setNewTeam((prev) => ({
        ...prev,
        technologies: checked
          ? [...prev.technologies, selectedTech]
          : prev.technologies.filter((tech) => tech.id !== selectedTech.id),
      }));
    } else if (name === 'projectType') {
      const selectedProjectType = projectTypes.find(type => type.id.toString() === value);
      setNewTeam((prev) => ({
        ...prev,
        projectType: selectedProjectType || null
      }));
    } else {
      setNewTeam((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Returns false when the form is incomplete. A request that fails throws: the shared client has
   * already shown the backend's message, and the caller decides what to do with the dialog.
   */
  const submit = async () => {
    if (!newTeam.name || !newTeam.projectDescription || !newTeam.projectType || !newTeam.technologies.length) {
      notify({ type: 'error', text: 'Заполните все поля формы.' });
      return false;
    }

    await createTeam({
      name: newTeam.name,
      project_description: newTeam.projectDescription,
      project_type: newTeam.projectType,
      captain_id: studentId,
      technologies: newTeam.technologies,
    });

    setNewTeam(EMPTY_TEAM);
    return true;
  };

  return { newTeam, handleChange, submit };
};
