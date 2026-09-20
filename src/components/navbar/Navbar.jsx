import { useCallback, useState, useRef, useEffect } from 'react';
import './style.css';
import { NavLink } from 'react-router-dom';
import { FaBars, FaChevronDown } from 'react-icons/fa';
import { logout } from '../../api/apiAuth';
import { useIdentity } from '../../context/identityContext';
import { useApplications } from '../../context/applicationsContext';
import { describeSelectionWindow } from '../../utils/selectionWindow';
import ConsoleMark from '../logo/ConsoleMark';
import ThemeToggle from '../header/Header';

const CATALOG_LINKS = [
  { to: '/teams', label: 'Команды' },
  { to: '/students', label: 'Участники' },
];

/**
 * What this account can actually reach. The catalogue answers 403 to an account without a
 * questionnaire for the current selection (Access.PARTICIPANT_OR_ADMIN), so it is not offered —
 * filling the questionnaire is the only thing to do from there.
 */
const buildLinks = ({ isParticipant, isAdmin, hasActiveTrack, currentTeamId, pendingApplications }) => {
  const links = [];

  if (isParticipant) {
    links.push(
      ...CATALOG_LINKS,
      { to: currentTeamId ? `/teams/${currentTeamId}` : '/profile', label: 'Моя команда' },
      { to: '/applications', label: 'Заявки', badge: pendingApplications },
      { to: '/how-it-works', label: 'Как проходит набор' },
    );
  } else if (isAdmin) {
    links.push(...CATALOG_LINKS);
  } else if (hasActiveTrack) {
    // Between two selections there is no questionnaire to fill in, so there is nothing to offer.
    // The guidance comes with it: it is the answer to what the questionnaire is for.
    links.push(
      { to: '/registration', label: 'Заполнить анкету' },
      { to: '/how-it-works', label: 'Как проходит набор' },
    );
  }

  if (isAdmin) {
    links.push({ to: '/admin', label: 'Администрирование' });
  }

  return links;
};

// Closes a dropdown on Escape and on a click outside it.
const useDismissable = (isOpen, close) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const dismiss = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && ref.current?.contains(event.target)) return;
      close();
    };

    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, [isOpen, close]);

  return ref;
};

const Navbar = () => {
  const { user, isAdmin, isParticipant, activeTrack, loading } = useIdentity();
  const { total: pendingApplications } = useApplications();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeAccount = useCallback(() => setIsAccountOpen(false), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const accountRef = useDismissable(isAccountOpen, closeAccount);
  const menuRef = useDismissable(isMenuOpen, closeMenu);

  const selection = describeSelectionWindow(activeTrack);
  const links = loading
    ? []
    : buildLinks({
      isParticipant,
      isAdmin,
      hasActiveTrack: activeTrack != null,
      currentTeamId: user?.student?.current_team_id ?? null,
      pendingApplications,
    });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.assign('/login');
    } catch (error) {
      // The shared client already showed what went wrong; staying signed in is the safe outcome.
      console.error('Не удалось выйти:', error);
    }
  };

  const renderLink = ({ to, label, badge }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => (isActive ? 'active-link' : '')}
      onClick={() => setIsMenuOpen(false)}
    >
      {label}
      {badge > 0 && (
        <span className="nav-badge" aria-label={`Ожидают ответа: ${badge}`}>{badge}</span>
      )}
    </NavLink>
  );

  return (
    <div className="navbar">
      {/* The bar is full-bleed, its row is not: sharing the page container is what puts the logo
          on the same line as the content below it. */}
      <div className="navbar-row page-container">
        <div className="logo"><ConsoleMark /></div>

        <nav className="nav-links" aria-label="Основная навигация">
          {links.map(renderLink)}
        </nav>

        <div className="navbar-actions">
          {selection && (
            <span className={`selection-state selection-${selection.state}`}>
              <span className="selection-name">{selection.name}</span>
              <span className="selection-note">{selection.note}</span>
            </span>
          )}
          {!selection && !loading && (
            <span className="selection-state selection-none">Отбор не идёт</span>
          )}

          <div className="nav-menu" ref={menuRef}>
            <button
              type="button"
              className={`select-icon nav-menu-button ${isMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-label="Меню разделов"
            >
              <FaBars aria-hidden="true" />
              {pendingApplications > 0 && <span className="nav-badge">{pendingApplications}</span>}
            </button>
            {isMenuOpen && (
              <div className="dropdown nav-menu-dropdown" role="menu">
                {/* Under 600px the bar above drops this line, and the deadline is the one thing a
                    student has to see while the window is open. Its CSS keeps it to those widths,
                    so between 600 and 900px the menu does not repeat what the bar still shows. */}
                {selection && (
                  <p className={`nav-menu-selection selection-${selection.state}`}>
                    <span>{selection.name}</span>
                    <span>{selection.note}</span>
                  </p>
                )}
                {links.map(renderLink)}
              </div>
            )}
          </div>

          <div className="account-menu" ref={accountRef}>
            <button
              type="button"
              className={`select-icon ${isAccountOpen ? 'open' : ''}`}
              onClick={() => setIsAccountOpen((prev) => !prev)}
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
            >
              <span>{user?.fio ?? 'Аккаунт'}</span>
              <FaChevronDown aria-hidden="true" />
            </button>
            {isAccountOpen && (
              <div className="dropdown account-dropdown" role="menu">
                <p className="account-identity">
                  <span className="account-name">{user?.fio}</span>
                  <span className="account-email">{user?.email}</span>
                </p>
                <button
                  type="button"
                  className="account-logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
