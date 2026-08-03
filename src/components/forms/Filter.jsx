import './style.css';
import { useMemo, useState } from "react";

const Filter = ({ filterParams, onApplyFilters, variant = "teams" }) => {
  const [binaryValue, setBinaryValue] = useState(null);
  const [captainValue, setCaptainValue] = useState(null);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const availableProjectTypes = useMemo(() => filterParams.projectTypes || [], [filterParams]);
  const availableTechnologies = useMemo(() => filterParams.technologies || [], [filterParams]);
  const availableCourses = useMemo(
    () => [...(filterParams.courses || [])].sort((a, b) => a - b),
    [filterParams]
  );
  const availableGroups = useMemo(
    () => [...(filterParams.groups || [])].sort((a, b) => a - b),
    [filterParams]
  );

  const toggleSelection = (setState, value) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    const filters = {
      ...(selectedTechnologies.length > 0 ? { technologies: selectedTechnologies } : {}),
      ...(variant === "students"
        ? {
            ...(binaryValue === null ? {} : { hasTeam: binaryValue }),
            ...(captainValue === null ? {} : { isCaptain: captainValue }),
            ...(selectedCourses.length > 0 ? { course: selectedCourses } : {}),
            ...(selectedGroups.length > 0 ? { groupNumber: selectedGroups } : {}),
          }
        : {
            ...(binaryValue === null ? {} : { isFull: binaryValue }),
            ...(selectedProjectTypes.length > 0 ? { projectType: selectedProjectTypes } : {}),
          }),
    };
    onApplyFilters(filters);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setBinaryValue(null);
    setCaptainValue(null);
    setSelectedProjectTypes([]);
    setSelectedTechnologies([]);
    setSelectedCourses([]);
    setSelectedGroups([]);
    onApplyFilters({});
    setIsExpanded(false);
  };

  const contentId = `${variant}-filters`;

  return (
    <div className="filter-section">
      <div className="filter-heading">
        <h2>Фильтры</h2>
        <button
          type="button"
          className="filter-toggle"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? 'Скрыть' : 'Показать'}
        </button>
      </div>

      <form
        id={contentId}
        className={`filter-content${isExpanded ? ' is-open' : ''}`}
        onSubmit={handleApplyFilters}
      >
        <div className="filter-group">
          <h3>{variant === "students" ? "Наличие команды" : "Заполненность"}</h3>
          {(variant === "students"
            ? ["Состоит в команде", "Ищет команду"]
            : ["Команда собрана", "Есть свободные места"]
          ).map((label, index) => (
            <label key={index}>
              <input
                type="radio"
                name={variant === "students" ? "hasTeam" : "isFull"}
                value={String(index === 0)}
                checked={binaryValue === (index === 0)}
                onChange={() => {
                  const value = index === 0;
                  setBinaryValue(value);
                  if (variant === "students" && !value && captainValue === true) {
                    setCaptainValue(null);
                  }
                }}
              />
              {label}
            </label>
          ))}
        </div>

        {variant === "teams" && <div className="filter-group">
          <h3>Тип проекта</h3>
          {availableProjectTypes.map((type) => (
            <label key={type.id ?? type.name}>
              <input
                type="checkbox"
                checked={selectedProjectTypes.includes(type.name)}
                onChange={() => toggleSelection(setSelectedProjectTypes, type.name)}
              />
              {type.name}
            </label>
          ))}
        </div>}

        {variant === "students" && availableCourses.length > 0 && (
          <div className="filter-group">
            <h3>Курс</h3>
            {availableCourses.map((course) => (
              <label key={course}>
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(course)}
                  onChange={() => toggleSelection(setSelectedCourses, course)}
                />
                {course} курс
              </label>
            ))}
          </div>
        )}

        {variant === "students" && availableGroups.length > 0 && (
          <div className="filter-group">
            <h3>Номер группы</h3>
            {availableGroups.map((group) => (
              <label key={group}>
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group)}
                  onChange={() => toggleSelection(setSelectedGroups, group)}
                />
                {group}
              </label>
            ))}
          </div>
        )}

        {variant === "students" && (
          <div className="filter-group">
            <h3>Роль</h3>
            {[['Капитан', true], ['Участник', false]].map(([label, value]) => (
              <label key={label}>
                <input
                  type="radio"
                  name="isCaptain"
                  value={String(value)}
                  checked={captainValue === value}
                  onChange={() => {
                    setCaptainValue(value);
                    if (value) setBinaryValue(true);
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        )}

        <div className="filter-group">
          <h3>Технологии</h3>
          {availableTechnologies.map((tech) => (
            <label key={tech.id}>
              <input
                type="checkbox"
                checked={selectedTechnologies.includes(tech.id)}
                onChange={() => toggleSelection(setSelectedTechnologies, tech.id)}
              />
              {tech.name}
            </label>
          ))}
        </div>

        <div className="filter-actions">
          <button type="submit" className="show-button">Применить</button>
          <button type="button" className="reset-button" onClick={handleReset}>Сбросить</button>
        </div>
      </form>
    </div>
  );
};

export default Filter;
