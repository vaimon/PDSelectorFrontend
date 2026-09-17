import './style.css'
import ConsoleMark from '../logo/ConsoleMark';
import ThemeToggle from '../header/Header';

// The frame every signed-out-looking screen shares: the questionnaire and the notices that replace
// it for an admin, between selections, or while identity is still loading.
const AuthShell = ({ title, children }) => (
  <main className="background">
    <div className="auth-theme-toggle"><ThemeToggle /></div>
    <div className="login-container registration-container">
      <div className="login-image">
        <ConsoleMark />
      </div>
      <div className="login-content registration-content">
        <p className="login-operator">ЮФУ · ФИИТ</p>
        <h2 className="welcome-text">{title}</h2>
        {children}
      </div>
    </div>
  </main>
);

export default AuthShell;
