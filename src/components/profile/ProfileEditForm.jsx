import { useState } from "react";
import "./style.css";
import Modal from "../forms/modal/Modal";

const ProfileEditForm = ({ studentData, onSave, onCancel, allTechnologies }) => {
  const [formData, setFormData] = useState({
    ...studentData,
    technologies: studentData.technologies || [],
  });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "fio") {
      setFormData((current) => ({
        ...current,
        user: { ...current.user, fio: value },
      }));
      return;
    }
    setFormData((current) => ({ ...current, [name]: value }));
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
    const flatStudentData = {
      about_self: formData.about_self,
      contacts: formData.contacts,
      course: formData.course,
      group_number: formData.group_number,
      technologies: formData.technologies, 
      user: formData.user
    };
    
    onSave(flatStudentData);
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
        <h2>Редактировать профиль</h2>

        <label>
          ФИО:
          <input
            type="text"
            name="fio"
            value={formData.user?.fio || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Курс:
          <input
            type="number"
            name="course"
            value={formData.course || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Группа:
          <input
            type="text"
            name="group_number"
            value={formData.group_number || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          О себе:
          <textarea
            name="about_self"
            value={formData.about_self || ""}
            onChange={handleChange}
          />
        </label>

        <label>
          Контакты:
          <input
            type="text"
            name="contacts"
            value={formData.contacts || ""}
            onChange={handleChange}
          />
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
          <button type="button" onClick={() => toggleModal("add")}>Добавить технологию</button>
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
                      checked={formData.technologies.some((t) => t.id === tech.id)}
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

export default ProfileEditForm;
