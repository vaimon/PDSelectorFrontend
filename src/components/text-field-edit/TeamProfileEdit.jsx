import { useState } from 'react';
import "./style.css";

const TeamProfileEdit = ({ teamName, teamDescription, initialTags, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(teamDescription);
    const [tags, setTags] = useState(initialTags.join(", "));

    const handleDescriptionChange = (event) => {
        setDescription(event.target.value);
    };

    const handleTagsChange = (event) => {
        setTags(event.target.value);
    };

    const toggleEdit = () => {
        if (isEditing) {
            const tagsArray = tags.split(",").map(tag => tag.trim());
            onSave(description, tagsArray);
        }
        setIsEditing(prev => !prev);
    };

    return (
        <div className="card">
            <div className="team-name">{teamName}</div>
            {isEditing ? (
                <>
                    <h5>Описание команды:</h5>
                    <textarea
                        className="team-description"
                        value={description}
                        onChange={handleDescriptionChange}
                    />
                    <h5>Технологии:</h5>
                    <input
                        className="tags-input"
                        type="text"
                        value={tags}
                        onChange={handleTagsChange}
                    />
                </>
            ) : (
                <>
                    <div className="main-info">{description}</div>
                    <div className="card-tags">
                        {tags.split(",").map((tag, index) => (
                            <span key={index} className="card-tag">{tag.trim()}</span>
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

export default TeamProfileEdit;
