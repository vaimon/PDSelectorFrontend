import { useNavigate } from "react-router-dom";
import { createStudent } from "../api/apiStudentsController";
import RegistrationForm from "../components/login-form/RegistrationForm";
import { useIdentity } from "../context/identityContext";

const Registration = () => {
  const navigate = useNavigate();
  const { user, refresh } = useIdentity();

  const handleFormSubmit = async (formData) => {
    // The form can be submitted before the identity request comes back; a student record without
    // its account is worse than asking to try again.
    if (!user?.id) {
      alert("Не удалось определить пользователя. Обновите страницу и попробуйте снова.");
      return;
    }

    try {
      // A student record belongs to the account that fills it in, hence the user id here — this is
      // the one place where it is the right identifier.
      await createStudent({ ...formData, user_id: user.id });

      // The account has a student record now, so every screen has to see the new student id.
      await refresh();
      alert("Регистрация завершена!");
      navigate("/teams");
    } catch (error) {
      // The shared client already showed what went wrong.
      console.error("Ошибка при регистрации студента:", error);
    }
  };

  const handleSkip = () => {
    navigate("/teams");
  };

  return <RegistrationForm onSubmit={handleFormSubmit} onSkip={handleSkip} />;
};

export default Registration;
