import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import { logout } from '../../api/apiAuth';
import { useIdentity } from '../../context/identityContext';
import useDismissable from '../../hooks/useDismissable';
import '../../styles/menu.css';
import './style.css';

/**
 * Who is signed in, and the way out. Shared by the student bar and the admin shell (#68), which
 * is why it reads the identity itself instead of being handed it.
 */
const AccountMenu = () => {
  const { user, isParticipant } = useIdentity();
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const ref = useDismissable(isOpen, close);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.assign('/login');
    } catch (error) {
      // The shared client already showed what went wrong; staying signed in is the safe outcome.
      console.error('Не удалось выйти:', error);
    }
  };

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className={`select-icon ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span>{user?.fio ?? 'Аккаунт'}</span>
        <FaChevronDown aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="dropdown account-dropdown" role="menu">
          <p className="account-identity">
            <span className="account-name">{user?.fio}</span>
            <span className="account-email">{user?.email}</span>
          </p>
          {/* The only way to the questionnaire once a team exists: «Моя команда» then points
              at the team's own page (#64). */}
          {isParticipant && (
            <Link to="/me" className="account-link" role="menuitem" onClick={close}>
              Мой профиль
            </Link>
          )}
          <button type="button" className="account-logout" role="menuitem" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
