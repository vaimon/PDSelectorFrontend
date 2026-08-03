import { useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import './style.css';

const THEME_STORAGE_KEY = 'console-theme';

const Header = () => {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || 'light',
  );

  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';
  const toggleLabel = isDark
    ? 'Включить светлую тему'
    : 'Включить тёмную тему';

  const toggleTheme = () => {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Storage may be unavailable; keep the selected theme for this page.
    }
  };

  return (
    <header className="console-header">
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={toggleLabel}
        aria-pressed={isDark}
        title={toggleLabel}
      >
        {isDark ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
        <span>{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
      </button>
    </header>
  );
};

export default Header;
