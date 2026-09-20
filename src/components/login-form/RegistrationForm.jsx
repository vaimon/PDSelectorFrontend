import { useEffect, useState } from "react";
import './style.css'
import AuthShell from './AuthShell';

const EMPTY = {
  course: "",
  groupNumber: "",
  contacts: "",
  aboutSelf: "",
  technologies: [],
};

// The backend stores the group as a number, so anything else would be silently dropped on the way.
const isGroupNumber = (value) => /^\d+$/.test(String(value).trim());

const RegistrationForm = ({
  user,
  courses,
  technologies = [],
  initialValues,
  isReturning = false,
  submitting = false,
  // null: no invitation. A string: the team the person was invited to, "" while its name is unknown.
  invitedTeam = null,
  onSubmit,
  onLeave,
}) => {
  const [formData, setFormData] = useState(initialValues ?? EMPTY);
  const [errors, setErrors] = useState({});

  // The record can still be on its way when the form mounts; the page keeps the form hidden until
  // it lands, so this only fills in a form nobody has typed into yet.
  useEffect(() => {
    if (initialValues) {
      setFormData({ ...EMPTY, ...initialValues });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTechnologyToggle = (technology) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.some((item) => item.id === technology.id)
        ? prev.technologies.filter((item) => item.id !== technology.id)
        : [...prev.technologies, technology],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newErrors = {
      course: !formData.course,
      groupNumber: !isGroupNumber(formData.groupNumber),
      contacts: !formData.contacts.trim(),
    };
    setErrors(newErrors);

    if (newErrors.course || newErrors.groupNumber || newErrors.contacts) {
      return;
    }

    onSubmit({
      course: Number(formData.course),
      group_number: Number(formData.groupNumber),
      contacts: formData.contacts.trim(),
      about_self: formData.aboutSelf.trim(),
      technologies: formData.technologies,
    });
  };

  return (
    <AuthShell title={isReturning ? "Проверьте анкету" : "Анкета участника набора"}>
      <p className="questionnaire-identity">
        Вы вошли как <strong>{user?.fio}</strong> ({user?.email}).{" "}
        <button type="button" className="questionnaire-link" onClick={onLeave}>
          Это не я — выйти
        </button>
      </p>

      <p className="login-purpose">
        {isReturning
          ? "Вы уже участвовали в наборе: данные подставлены из прошлой анкеты. Проверьте курс и группу — за год они изменились."
          : "Анкету видят участники набора и организаторы. Тимлиды команд ищут людей именно по ней."}
      </p>

      {invitedTeam !== null && (
        <p className="questionnaire-invitation">
          {invitedTeam
            ? <>После анкеты вернём вас к приглашению в команду <strong>«{invitedTeam}»</strong>.</>
            : "После анкеты вернём вас к приглашению в команду."}
        </p>
      )}

      <form className="registration-form" onSubmit={handleSubmit}>
        <label htmlFor="course">Курс</label>
        <select
          id="course"
          name="course"
          value={formData.course}
          onChange={handleChange}
          className={errors.course ? "input-error" : ""}
          aria-invalid={errors.course || undefined}
          aria-describedby={errors.course ? "course-error" : undefined}
        >
          <option value="">Выберите курс</option>
          {courses.map((course) => (
            <option key={course} value={course}>{course} курс</option>
          ))}
        </select>
        {errors.course && <p className="error-text" id="course-error">Укажите курс</p>}

        <label htmlFor="groupNumber">Номер группы</label>
        <input
          type="text"
          inputMode="numeric"
          id="groupNumber"
          name="groupNumber"
          value={formData.groupNumber}
          onChange={handleChange}
          placeholder="Например, 2"
          className={errors.groupNumber ? "input-error" : ""}
          aria-invalid={errors.groupNumber || undefined}
          aria-describedby={errors.groupNumber ? "group-error" : undefined}
        />
        {errors.groupNumber && (
          <p className="error-text" id="group-error">Номер группы — это число, например 2</p>
        )}

        <label htmlFor="contacts">Как с вами связаться</label>
        <input
          type="text"
          id="contacts"
          name="contacts"
          value={formData.contacts}
          onChange={handleChange}
          placeholder="Например, @ivanov в Telegram"
          className={errors.contacts ? "input-error" : ""}
          aria-invalid={errors.contacts || undefined}
          aria-describedby={errors.contacts ? "contacts-hint contacts-error" : "contacts-hint"}
        />
        <p className="field-hint" id="contacts-hint">
          По этому контакту с вами свяжется тимлид команды.
        </p>
        {errors.contacts && (
          <p className="error-text" id="contacts-error">Укажите контакт для связи</p>
        )}

        <fieldset className="questionnaire-technologies">
          <legend>Технологии</legend>
          <p className="field-hint">
            Отметьте то, с чем уже работали или хотите работать: по технологиям вас находят
            в каталоге участников.
          </p>
          <div className="technologies-grid">
            {technologies.map((technology) => (
              <label key={technology.id} className="technology-option">
                <input
                  type="checkbox"
                  name="technologies"
                  value={technology.id}
                  checked={formData.technologies.some((item) => item.id === technology.id)}
                  onChange={() => handleTechnologyToggle(technology)}
                />
                <span>{technology.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="aboutSelf">О себе</label>
        <textarea
          id="aboutSelf"
          name="aboutSelf"
          value={formData.aboutSelf}
          onChange={handleChange}
          placeholder="Пара предложений: чем интересно заниматься, что уже делали"
          rows="3"
        />

        <p className="questionnaire-note">
          Анкета доступна зарегистрированным участникам набора и организаторам проектной
          деятельности. Другим она не видна.
        </p>

        <div className="form-buttons">
          <button type="submit" className="register-button" disabled={submitting}>
            {isReturning ? "Подтвердить анкету" : "Отправить анкету"}
          </button>
          <button type="button" className="questionnaire-link" onClick={onLeave}>
            Я не участвую в наборе
          </button>
        </div>
      </form>
    </AuthShell>
  );
};

export default RegistrationForm;
