
import './style.css'
import { useEffect } from 'react';
import ConsoleMark from '../logo/ConsoleMark';

const LoginForm = () => {
  const handleLogin = () => {
    // Same-origin by default (nginx proxies /oauth2 to the backend on teams.pd-mmcs.ru);
    // VITE_BACKEND_URL overrides for cross-origin local dev.
    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';
    window.location.href = `${backendUrl}/oauth2/authorization/azure`;
  };

  const getCookieValue = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  useEffect(() => {
    const cookieNames = ['trackId', 'userId', 'JSESSIONID', 'SessionId'];
    cookieNames.forEach((cookieName) => {
      const cookieValue = getCookieValue(cookieName);
      if (cookieValue) {
        localStorage.setItem(cookieName, cookieValue);
        console.log(`Кука ${cookieName} перемещена в localStorage: ${cookieValue}`);
      } else {
        console.warn(`Кука ${cookieName} не найдена.`);
      }
    });
  }, []);

  return (
    <main className="background">
      <div className="login-container">
        <div className="login-image">
          <ConsoleMark />
        </div>
        <div className="login-content">
          <div className="login-identity">
            <p className="login-operator">ЮФУ · ФИИТ</p>
            <h1 className="welcome-text">Проектная деятельность</h1>
            <p className="login-purpose">
              Портал выбора команд проектной деятельности
            </p>
          </div>

          <div className="login-authentication">
            <button
              type="button"
              className="login-button"
              onClick={handleLogin}
              aria-describedby="login-auth-note"
            >
              Войти с аккаунтом ЮФУ
            </button>
            <p className="login-auth-note" id="login-auth-note">
              Вы будете направлены на <strong>login.microsoftonline.com</strong>.
              {' '}Пароль вводится на Microsoft, не здесь.
            </p>
          </div>

          <a
            className="login-trust-link"
            href="https://mmcs.sfedu.ru/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Институт математики, механики и компьютерных наук ЮФУ
            <span>mmcs.sfedu.ru</span>
          </a>
        </div>
      </div>
    </main>
  );
};
export default LoginForm;

 
