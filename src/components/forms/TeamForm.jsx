function TeamForm({
  newTeam,
  technologies,
  projectTypes,
  onChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="team-form">
      <label htmlFor="name">Название команды:</label>
      <input
        id="name"
        type="text"
        name="name"
        value={newTeam.name}
        onChange={onChange}
        required
      />

      <label htmlFor="projectDescription">Описание проекта:</label>
      <textarea
        id="projectDescription"
        name="projectDescription"
        value={newTeam.projectDescription}
        onChange={onChange}
        maxLength="1024"
        required
      />

      <label htmlFor="projectType">Тип проекта:</label>
      <div className="technologies-list">
        {projectTypes && projectTypes.length > 0 ? (
          projectTypes.map((type) => (
            <div key={type.id} className="project-type-radio">
              <input
                type="radio"
                id={`projectType-${type.id}`}
                name="projectType"
                value={type.id}
                checked={newTeam.projectType && newTeam.projectType.id === type.id}
                onChange={onChange}
              />
              <label htmlFor={`projectType-${type.id}`}>{type.name}</label>
            </div>
          ))
        ) : (
          <p>Нет доступных типов проекта</p>
        )}
      </div>

      <label htmlFor="technologies">Технологии:</label>
      <div className="technologies-list">
        {technologies && technologies.length > 0 ? (
          technologies.map((tech) => (
            <div key={tech.id} className="technology-checkbox">
              <input
                type="checkbox"
                id={`tech-${tech.id}`}
                name="technologies"
                value={tech.id}
                checked={newTeam.technologies.some((t) => t.id === tech.id)}
                onChange={onChange}
              />
              <label htmlFor={`tech-${tech.id}`}>{tech.name}</label>
            </div>
          ))
        ) : (
          <p>Нет доступных технологий</p>
        )}
      </div>
      <button type="submit">Создать команду</button>
    </form>
  );
}

export default TeamForm;
