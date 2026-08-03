import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";


const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) {
      navigate('/profile');
    } else {
      console.error('Ошибка: токен отсутствует');
    }
  }, [navigate]);

  return (
    <main className="status-page" aria-live="polite">
      <h1>Авторизация</h1>
      <p>Проверяем данные и открываем профиль…</p>
    </main>
  );
};

export default AuthPage;

