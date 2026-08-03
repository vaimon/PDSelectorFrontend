import { useState } from 'react';
import "./style.css";
/*
const Resume = () => {
  return (
    <div className="my-resume">
      <div className="my-resume-name">Иван Иванов</div>
      <div className="main-info">
        Опытный разработчик с большим опытом в разработке веб-приложений и API.
      </div>
      <div className="card-tags">
        <span className="card-tag">JavaScript</span>
        <span className="card-tag">React</span>
        <span className="card-tag">Node.js</span>
      </div>
    </div>
  );
};
*/

let tags= ['JavaScript', 'React', 'Node.js'];

const TextFieldEdit = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [infoText, setInfoText] = useState("Опытный разработчик с большим опытом в разработке веб-приложений и API.");
    const [tagsText, setTagsText] = useState(tags);
    
    const handleChange = (event) => {
        setInfoText(event.target.value);
    };

    const tagsChange = (event) => {
        tags =event.target.value.split(",");
        
        setTagsText(tags);
    };

    const toggleEdit = () => {
        setIsEditing(prev => !prev);
    };

    return (
        <div className="my-resume">
            <div className="my-resume-name">Иван Иванов</div>
            {isEditing ? (
                <>
                <h5>Информация о себе:</h5>
                <textarea className="info"
                    type="text"
                    value={infoText}
                    onChange={handleChange}
                />
                <h5>Теги:</h5>
                <input className="tags-input"
                    type="text"
                    value={tagsText}
                    onChange={tagsChange}
                />
                </>
            ) : (
                <>
                <div className="main-info">{infoText}</div>
                <div className="card-tags">

                {tags.map((tag, index) => (
                    <span key={index} className="card-tag">{tag}</span>
                ))}

                </div>
                </>
            )}
            <button type="button" className="button-input" onClick={toggleEdit}>
                {isEditing ? 'Сохранить' : 'Редактировать'}
            </button>
        </div>
    );
};

export default TextFieldEdit;
