import { useState } from "react";
import './style.css'
import ConsoleMark from '../logo/ConsoleMark';
import ThemeToggle from '../header/Header';

const RegistrationForm = ({ onSubmit, onSkip }) => {
    const [formData, setFormData] = useState({
      course: "",
      groupNumber: "",
      aboutSelf: "",
      contacts: "",
    });
  
    const [errors, setErrors] = useState({
      course: false,
      groupNumber: false,
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    };
  
    const handleSubmit = (event) => {
      event.preventDefault();
      const newErrors = {
        course: !formData.course,
        groupNumber: !formData.groupNumber,
      };
  
      setErrors(newErrors);
  
      if (!newErrors.course && !newErrors.groupNumber) {
        const formDataSnakeCase = {
          course: formData.course,
          group_number: formData.groupNumber,
          about_self: formData.aboutSelf,
          contacts: formData.contacts,
        };
        onSubmit(formDataSnakeCase);
      }
    };
  
    const handleSkip = () => {
      if (onSkip) {
        onSkip();
      }
    };
  
    return (
      <main className="background">
        <div className="auth-theme-toggle"><ThemeToggle /></div>
        <div className="login-container registration-container">
          <div className="login-image">
            <ConsoleMark />
          </div>
          <div className="login-content registration-content">
            <p className="login-operator">ЮФУ · ФИИТ</p>
            <h2 className="welcome-text">Создание аккаунта студента</h2>
            <p className="login-purpose">Заполните данные, которые увидят команды и другие участники.</p>
  
            <form className="registration-form" onSubmit={handleSubmit}>
              <label htmlFor="course">Курс</label>
              <input
                type="number"
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="Введите курс"
                className={errors.course ? "input-error" : ""}
                min="1"
                max="6"
                required
              />
              {errors.course && <p className="error-text">Курс обязателен</p>}
  
              <label htmlFor="groupNumber">Номер группы</label>
              <input
                type="text"
                id="groupNumber"
                name="groupNumber"
                value={formData.groupNumber}
                onChange={handleChange}
                placeholder="Введите номер группы"
                className={errors.groupNumber ? "input-error" : ""}
                required
              />
              {errors.groupNumber && <p className="error-text">Номер группы обязателен</p>}
  
              <label htmlFor="aboutSelf">О себе</label>
              <textarea
                id="aboutSelf"
                name="aboutSelf"
                value={formData.aboutSelf}
                onChange={handleChange}
                placeholder="Расскажите немного о себе"
                rows="4"
              />
  
              <label htmlFor="contacts">Контакты</label>
              <input
                type="text"
                id="contacts"
                name="contacts"
                value={formData.contacts}
                onChange={handleChange}
                placeholder="Введите ваши контакты"
              />
  
              <div className="form-buttons">
                <button
                  type="submit"
                  className="register-button"
                >
                  Завершить регистрацию
                </button>
                <button
                  type="button"
                  className="login-jury-button"
                  onClick={handleSkip}
                >
                  Продолжить без регистрации студента
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  };

  export default RegistrationForm;
