import "./style.css";

const DropDownTechnologies = ({
  technologies_all,
  dropDownOpenFlag,
  setterForNewTech,
  techNew,
}) => {
  const handleTechSelect = (tech) => {
    dropDownOpenFlag(false);
    setterForNewTech(tech.name);
  };

  const handleCustomTechChange = (e) => {
    setterForNewTech(e.target.value);
  };

  return (
    <ul className="technology-dropdown" role="listbox" aria-label="Доступные технологии">
      {technologies_all && technologies_all.length > 0 ? (
        technologies_all.map((tech) => {
          console.log("Tech: ", tech);
          return (
            <li key={tech.id}>
              <button type="button" onClick={() => handleTechSelect(tech)}>
              {tech.name}
              </button>
            </li>
          );
        })
      ) : (
        <li className="technology-dropdown-empty">Нет доступных технологий</li>
      )}
      <li>
        <input
          type="text"
          value={techNew}
          onChange={handleCustomTechChange}
          placeholder="Введите свою технологию"
          aria-label="Своя технология"
        />
      </li>
    </ul>
  );
};

export default DropDownTechnologies;
