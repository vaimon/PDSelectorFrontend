import "./style.css";
const ProfileCard = ({ studentData, onEdit, isCurrentUser }) => {
  const initials = studentData.user?.fio
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          {studentData.avatar ? (
            <img
              src={studentData.avatar}
              alt="Аватар пользователя"
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">
              {initials || 'ПД'}
            </div>
          )}
          <h2 className="profile-name">
            {studentData.user?.fio || "Имя Фамилия"}
          </h2>
          <p className="profile-course">
            Курс: {studentData.course || "Не указан"}
          </p>
        </div>
        <div className="profile-details">
          <div className="profile-detail">
            <strong>Группа:</strong>{" "}
            <span>{studentData.group_number || "Не указана"}</span>
          </div>
          <div className="profile-detail">
            <strong>Контакты:</strong>{" "}
            <span>{studentData.contacts || "Не указаны"}</span>
          </div>
          <div className="profile-detail profile-detail--about">
            <strong>О себе:</strong>
            <span>{studentData.about_self || "Описание пока не добавлено"}</span>
          </div>
          <div className="profile-detail">
            <strong>Технологии:</strong>
            <div className="card-tags">
              {studentData.technologies?.length > 0 ? (
                studentData.technologies.map((tag, index) => (
                  <span key={index} className="card-tag">
                    {tag.name}
                  </span>
                ))
              ) : (
                <span className="no-tags">-</span>
              )}
            </div>
          </div>
        </div>
        {isCurrentUser && (
          <button className="edit-button" onClick={onEdit}>
            Редактировать
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
