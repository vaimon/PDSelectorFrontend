import "./style.css"
import { useState } from "react";
import { Link } from "react-router-dom";


const Card = ({
  name,
  type,
  resume,
  tags = [],
  profileLink,
  showActionsForStudent = true,
  onApply,
  applyText = "Подать заявку",
  applyDisabled = false,
  applyReason,
  applyTone = "primary",
  viewText = "Перейти",
  showApplyButton,
  showEditingOptions,
  badge,
  note,
  actions = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentName, setCurrentName] = useState(name);
  const [currentType, setCurrentType] = useState(type);
  const [currentResume, setCurrentResume] = useState(resume);
  const [currentTags, setCurrentTags] = useState(
    tags.map((tag) => typeof tag === 'string' ? tag : tag.name),
  );
  const handleApply = () => {
    if (onApply) onApply();
  };

  const handleSave = () => {
    console.log("Сохранено:", { currentName, currentType, currentResume, currentTags });
    setIsEditing(false);
  };

  const showApplyAction = showActionsForStudent && showApplyButton && onApply;
  const showViewAction = Boolean(profileLink);
  const hasActions = showApplyAction || showViewAction || showEditingOptions || actions.length > 0;
  // Same rule as the apply button: a disabled action has to say why in text, because a phone has
  // no hover and a disabled button is not reachable with a keyboard or a screen reader.
  // Two actions off for the same reason — the closed window — say it once.
  const reasons = [...new Set([
    ...(showApplyAction && applyDisabled && applyReason ? [applyReason] : []),
    ...actions.filter((action) => action.disabled && action.reason).map((action) => action.reason),
  ])];

  return (
    <div className={`card ${currentType ? 'card--with-type' : 'card--person'}`}>
      <div className="card-header">
        {isEditing ? (
          <input
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            className="card-name-input"
          />
        ) : (
          <h3 className="card-name" title={currentName}>{currentName}</h3>
        )}
        {badge && <span className="card-badge">{badge}</span>}
        {currentType && (
          <p className="card-type">
            <span className="type-capture">Тип проекта: </span>
            {isEditing ? (
              <input
                type="text"
                value={currentType}
                onChange={(e) => setCurrentType(e.target.value)}
                className="card-type-input"
              />
            ) : (
              currentType
            )}
          </p>
        )}
      </div>
      <div className="card-body">
        {currentResume && (
          <p className="card-resume" title={currentResume}>
            <span className="type-capture">Резюме: </span>
            {isEditing ? (
              <textarea
                value={currentResume}
                onChange={(e) => setCurrentResume(e.target.value)}
                className="card-resume-input"
              />
            ) : (
              currentResume
            )}
          </p>
        )}
        <div className="card-tags">
          <span className="text-capture">Технологии: </span>
          {isEditing ? (
            <input
              type="text"
              value={currentTags.join(', ')} 
              onChange={(e) => setCurrentTags(e.target.value.split(',').map(tag => tag.trim()))} 
              className="card-tags-input"
            />
          ) : (
            currentTags.length > 0 ? (
              currentTags.map((tag, index) => (
                <span key={index} className="card-tag">
                  {tag}
                </span>
              ))
            ) : (
              <p className="no-tags">-</p>
            )
          )}
        </div>
      </div>
      {note && <p className="card-note">{note}</p>}
      {reasons.map((reason) => (
        <p className="card-action-reason" key={reason}>{reason}</p>
      ))}
      {hasActions && <div className="card-actions">
        {actions.map((action) => (
          <button
            key={action.key ?? action.label}
            type="button"
            className={`action-button apply${action.tone === "cancel" ? " action-button--cancel" : ""}`}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.reason}
          >
            {action.label}
          </button>
        ))}
        {showApplyAction && (
          <button
            className={`action-button apply${applyTone === "cancel" ? " action-button--cancel" : ""}`}
            onClick={handleApply}
            disabled={applyDisabled}
            title={applyReason}
          >
            {applyText}
          </button>
        )}
        {showViewAction && <Link
          to={profileLink}
          className="action-button view action-link"
        >
          {viewText}
        </Link>}
        {showEditingOptions && <button className="action-button edit" onClick={() => {
          if (isEditing) handleSave(); 
          setIsEditing(!isEditing); 
        }}>
          {isEditing ? "Сохранить" : "Редактировать"}
        </button>}
        
      </div>}
    </div>
  );
};

export default Card;
