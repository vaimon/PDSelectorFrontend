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

  // PUT /students/{id} validates the whole StudentUpdateDto (#66): course, group, current_track and
  // user are required even though a student's save applies only «О себе», contacts and technologies.
  // They go back exactly as loaded.
  const handleSave = () => {
    onSave({
      about_self: formData.about_self,
      contacts: formData.contacts,
      course: studentData.course,
      group_number: studentData.group_number,
      current_track: { id: studentData.current_track.id },
      technologies: formData.technologies,
      user: studentData.user,
    });
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

        {/* Not inputs: the backend ignores these three from a student, and the course decides which
            year's places they take in a team. */}
        <div className="profile-details">
          <div className="profile-detail">
            <strong>ФИО:</strong> <span>{studentData.user?.fio}</span>
          </div>
          <div className="profile-detail">
            <strong>Курс:</strong> <span>{studentData.course || "Не указан"}</span>
          </div>
          <div className="profile-detail">
            <strong>Группа:</strong> <span>{studentData.group_number || "Не указана"}</span>
          </div>
        </div>
        <p className="profile-edit-note">
          ФИО, курс и группу меняет администратор набора — напишите организаторам, если здесь ошибка.
        </p>

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
