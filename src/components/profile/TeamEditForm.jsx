import { useState, useEffect } from "react";
import Modal from "../forms/modal/Modal";


const TeamEditForm = ({
  teamData,
  onSave,
  onCancel,
  allTechnologies,
  projectTypes,
}) => {
  const [formData, setFormData] = useState({
    ...teamData,
    technologies: teamData.technologies || [],
    project_type: teamData.project_type || null, 
  });
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  useEffect(() => {
    setFormData({
      ...teamData,
      technologies: teamData.technologies || [],
      project_type: teamData.project_type || null, 
    });
  }, [teamData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProjectTypeChange = (e) => {
    const { value } = e.target;
    console.log(value);
    setFormData((prev) => ({ ...prev, project_type: projectTypes.find(type => type.id === (value*1)) }));
  };
  

  const handleRemoveTechnology = (idToRemove) => {
    const updatedTechnologies = formData.technologies.filter(
      (tech) => tech.id !== idToRemove
    );
    setFormData({ ...formData, technologies: updatedTechnologies });
  };

  const toggleModal = (type = "") => {
    setModalType(type);
    setShowModal((prev) => !prev);
  };

  const handleSave = () => {
    const flatTeamData = {
      name: formData.name,
      project_description: formData.project_description,
      project_type: formData.project_type,
      technologies: formData.technologies,
    };

    onSave(flatTeamData);
  };

  const handleTechnologyChange = (tech) => {
    const isSelected = formData.technologies.some((t) => t.id === tech.id);
    const updatedTechnologies = isSelected
      ? formData.technologies.filter((t) => t.id !== tech.id)
      : [...formData.technologies, tech];

    setFormData({ ...formData, technologies: updatedTechnologies });
  };

  return (
    <div className="profile-container">
      <div className="profile-edit-form">
        <h2>Редактировать команду</h2>

        <label>
          Название команды:
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Описание проекта:
          <textarea
            name="project_description"
            value={formData.project_description || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Тип проекта:
          <div className="technologies-list">
            {projectTypes && projectTypes.length > 0 ? (
              projectTypes.map((type) => (
                <div key={type.id}>
                  <input
                    type="radio"
                    id={`projectType-${type.id}`}
                    name="project_type" 
                    value={type.id} 
                    checked={formData.project_type?.id?.toString() === type.id.toString()}
                    onChange={handleProjectTypeChange}
                  />
                  <label htmlFor={`projectType-${type.id}`}>{type.name}</label>
                </div>
              ))
            ) : (
              <p>Нет доступных типов проекта</p>
            )}
          </div>
        </label>
        <label>
          <span className="text-capture">Технологии:</span>
          <div className="card-tags">
            {formData.technologies.length > 0 ? (
              formData.technologies.map((tech) => (
                <span key={tech.id} className="card-tag">
                  {tech.name}
                  <button
                    type="button"
                    className="remove-icon"
                    onClick={() => handleRemoveTechnology(tech.id)}
                    aria-label={`Удалить технологию ${tech.name}`}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <p className="no-tags">-</p>
            )}
          </div>
        </label>

        <div className="form-buttons">
          <button type="button" onClick={() => toggleModal("add")}>
            Добавить технологию
          </button>
          <button type="button" className="save-button" onClick={handleSave}>
            Сохранить
          </button>
          <button type="button" className="cancel-button" onClick={onCancel}>
            Отменить
          </button>
        </div>
      </div>

      {showModal && modalType === "add" && (
        <Modal show={showModal} onClose={() => toggleModal()}>
          <div>
            <h2>Добавить технологию</h2>
            <div className="technologies-list">
              {allTechnologies && allTechnologies.length > 0 ? (
                allTechnologies.map((tech) => (
                  <div key={tech.id} className="technology-checkbox">
                    <input
                      type="checkbox"
                      id={`tech-${tech.id}`}
                      name="technologies"
                      checked={formData.technologies.some(
                        (t) => t.id === tech.id
                      )}
                      onChange={() => handleTechnologyChange(tech)}
                    />
                    <label htmlFor={`tech-${tech.id}`}>{tech.name}</label>
                  </div>
                ))
              ) : (
                <p>Нет доступных технологий</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeamEditForm;
