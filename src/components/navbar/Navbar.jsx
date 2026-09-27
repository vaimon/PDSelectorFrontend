import { useCallback, useState } from 'react';
import '../../styles/menu.css';
import './style.css';
import { NavLink } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { useIdentity } from '../../context/identityContext';
import { useApplications } from '../../context/applicationsContext';
import useDismissable from '../../hooks/useDismissable';
import { describeSelectionWindow } from '../../utils/selectionWindow';
import AccountMenu from '../account-menu/AccountMenu';
import ConsoleMark from '../logo/ConsoleMark';
import QuestionMark from '../icons/QuestionMark';
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
      { to: '/how-it-works', label: 'Как проходит набор', icon: true },
    );
  } else if (isAdmin) {
    links.push(...CATALOG_LINKS);
  } else if (hasActiveTrack) {
    // Between two selections there is no questionnaire to fill in, so there is nothing to offer.
    // The guidance comes with it: it is the answer to what the questionnaire is for.
    links.push(
      { to: '/registration', label: 'Заполнить анкету' },
      { to: '/how-it-works', label: 'Как проходит набор', icon: true },
    );
  }

  if (isAdmin) {
    links.push({ to: '/admin', label: 'Администрирование' });
  }

  return links;
};

const Navbar = () => {
  const { user, isAdmin, isParticipant, activeTrack, loading } = useIdentity();
  const { total: pendingApplications } = useApplications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
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

  /**
   * In the bar the guidance is a «?» in a circle (#61) — it is the one item nobody navigates by
   * name. It keeps the label as its accessible name, and in the dropdown it stays a worded item:
   * a list of names with one bare icon in it reads as a mistake.
   */
  const renderLink = ({ to, label, badge, icon }, { inMenu = false } = {}) => {
    const asIcon = icon && !inMenu;
    return (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => `${isActive ? 'active-link' : ''}${asIcon ? ' nav-icon-link' : ''}`.trim()}
        onClick={() => setIsMenuOpen(false)}
        aria-label={asIcon ? label : undefined}
        title={asIcon ? label : undefined}
      >
        {asIcon ? <QuestionMark /> : label}
        {badge > 0 && (
          <span className="nav-badge" aria-label={`Ожидают ответа: ${badge}`}>{badge}</span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="navbar">
      {/* The bar is full-bleed, its row is not: sharing the page container is what puts the logo
          on the same line as the content below it. */}
      <div className="navbar-row page-container">
        <div className="logo"><ConsoleMark /></div>

        <nav className="nav-links" aria-label="Основная навигация">
          {links.map((link) => renderLink(link))}
        </nav>

        <div className="navbar-actions">
          {selection && (
            <span className={`selection-state selection-${selection.state}`}>
              <span className="selection-name">{selection.name}</span>
              <span className="selection-note">{selection.note}</span>
            </span>
          )}
          {!selection && !loading && (
            <span className="selection-state selection-none">Набор не идёт</span>
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
                {links.map((link) => renderLink(link, { inMenu: true }))}
              </div>
            )}
          </div>

          <AccountMenu />

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
