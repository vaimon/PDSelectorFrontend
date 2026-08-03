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
  viewText = "Перейти",
  showApplyButton,
  showEditingOptions
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
  const hasActions = showApplyAction || showViewAction || showEditingOptions;

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
      {hasActions && <div className="card-actions">
        {showApplyAction && (
          <button className="action-button apply" onClick={handleApply}>
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
