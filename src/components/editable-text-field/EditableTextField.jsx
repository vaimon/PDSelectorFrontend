import { useState, useEffect } from "react";
import "./style.css";
import { FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";
import { fetchFilterParamsByTrackId } from "../../api/apiTeamsController";
import { getSavedTrackId } from "../../hooks/cookieUtils";
import DropDownTechnologies from "../drop-down-technologies/DropDownTechnologies";


const EditableDescription = ({
  initialDescription = "",
  initialTechnologies = [],
  onSave,
  canEdit,
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [technologies, setTechnologies] = useState(initialTechnologies);
  const [newTech, setNewTech] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allTechnologies, setAllTechnologies] = useState(initialTechnologies);

  useEffect(() => {
    if (!isEditing) {
      setDescription(initialDescription);
      setTechnologies(initialTechnologies);
    }
    const loadFilters = async () => {
      const trackId = getSavedTrackId();
      console.log("trackId", trackId);
      if (!trackId) return;
      try {
        const params = await fetchFilterParamsByTrackId(trackId);
        setAllTechnologies(params.technologies);
      } catch (error) {
        console.error("Ошибка при получении параметров фильтра:", error);
      }
    };

    loadFilters();
  }, [initialDescription, initialTechnologies, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (onSave) {
      onSave({
        description,
        technologies,
      });
    }
  };

  const handleAddTechnology = () => {
    if (newTech.trim()) {
      setTechnologies((prev) => [...prev, newTech.trim()]);
      setNewTech("");
    }
  };

  const handleRemoveTechnology = (index) => {
    setTechnologies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const technologyLabel = (technology) => technology?.name || technology;

  return (
    <div className="editable-description">
      {isEditing ? (
        <>
          <textarea
            className="description-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="technologies">
            <ul>
              {technologies.map((tech, index) => (
                <li key={tech.id||index} className="technology-item">
                  {technologyLabel(tech)}
                  <button
                    type="button"
                    className="button-remove-tech"
                    onClick={() => handleRemoveTechnology(index)}
                    aria-label={`Удалить технологию ${technologyLabel(tech)}`}
                  >
                    <FaTrash aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-technology">
              <input
                type="text"
                readOnly
                value={newTech}
                onClick={handleToggleDropdown}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Добавить технологию"
              />
              {isDropdownOpen && (
                <DropDownTechnologies technologies_all = {allTechnologies} dropDownOpenFlag={setIsDropdownOpen} setterForNewTech={setNewTech} techNew={newTech}/>
              )}
              <button type="button" className="button-add-tech" onClick={handleAddTechnology} aria-label="Добавить технологию">
                <FaPlus aria-hidden="true" />
              </button>
            </div>
          </div>
          <button type="button" className="button-save" onClick={handleSave}>
            <FaSave aria-hidden="true" /> Сохранить
          </button>
        </>
      ) : (
        <>
          <p className="description-text">{description || "Нет описания"}</p>
          <div className="card-tags">
            <strong>Технологии:</strong>

            {technologies.length > 0 ? (
              technologies.map((tech) => (
                <span key={tech.id||tech} className="card-tag">
                  {technologyLabel(tech)}
                </span>
              ))
            ) : (
              <p>Нет технологий</p>
            )}
          </div>
          {canEdit && (
            <button type="button" className="button-edit" onClick={() => setIsEditing(true)}>
              <FaEdit aria-hidden="true" /> Редактировать
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default EditableDescription;
