import './style.css';
import { useState } from "react";
import { useMemo } from 'react';

const Filter = ({ filterParams, onApplyFilters, variant = "teams" }) => {
  const [binaryValue, setBinaryValue] = useState(null);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);


  const availableProjectTypes = useMemo(() => filterParams.projectTypes || [], [filterParams]);
  const availableTechnologies = useMemo(() => filterParams.technologies || [], [filterParams]);


  const toggleSelection = (setState, value) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleApplyFilters = () => {
    const filters = {
      technologies: selectedTechnologies.length > 0 ? selectedTechnologies : null,
      ...(variant === "students"
        ? { hasTeam: binaryValue }
        : {
            isFull: binaryValue,
            projectType: selectedProjectTypes.length > 0 ? selectedProjectTypes : null,
          }),
    };
    onApplyFilters(filters);
  };

  return (
    <div className="filter-section">
      <div className="filter-heading">
        <h2>Фильтры</h2>
        <button
          type="button"
          className="filter-toggle"
          aria-expanded={isExpanded}
          aria-controls="teams-filters"
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? 'Скрыть' : 'Показать'}
        </button>
      </div>

      <div
        id="teams-filters"
        className={`filter-content${isExpanded ? ' is-open' : ''}`}
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
                onChange={() => setBinaryValue(index === 0)}
              />
              {label}
            </label>
          ))}
        </div>

        {variant === "teams" && <div className="filter-group">
          <h3>Тип проекта</h3>
          {availableProjectTypes.map((type) => (
            <label key={type.id}>
              <input
                type="checkbox"
                checked={selectedProjectTypes.includes(type.id)}
                onChange={() => toggleSelection(setSelectedProjectTypes, type.id)}
              />
              {type.name}
            </label>
          ))}
        </div>}

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

        <button className="show-button" onClick={handleApplyFilters}>
          Применить фильтры
        </button>
      </div>
    </div>
  );
};

export default Filter;
