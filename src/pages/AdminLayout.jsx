import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import AccountMenu from "../components/account-menu/AccountMenu";
import SelectionPill from "../components/admin-shell/SelectionPill";
import ThemeToggle from "../components/header/Header";
import {
  AccessIcon,
  BoardIcon,
  CloseIcon,
  HistoryIcon,
  MenuIcon,
  OutgoingIcon,
  OverviewIcon,
  PeopleIcon,
  SettingsIcon,
  StudentIcon,
  TeamsIcon,
} from "../components/icons/AdminIcons";
import ConsoleMark from "../components/logo/ConsoleMark";
import useAdminOverview from "../hooks/useAdminOverview";
import "./AdminLayout.css";
import "./AdminList.css";

/**
 * The sections, in the order the sidebar shows them. The page heading is read from here too, so
 * a section's name is written once. `end` on the overview only: it lives at /admin itself, so
 * without it every section below would light it up as well.
 */
const SECTION_GROUPS = [
  {
    label: "Набор",
    items: [
      { to: "/admin", label: "Обзор", Icon: OverviewIcon, end: true },
      { to: "/admin/board", label: "Состав", Icon: BoardIcon, countsShortTeams: true },
      { to: "/admin/people", label: "Участники и команды", Icon: PeopleIcon },
    ],
  },
  {
    label: "Управление",
    items: [
      { to: "/admin/settings", label: "Настройки", Icon: SettingsIcon },
      { to: "/admin/access", label: "Доступ", Icon: AccessIcon },
      { to: "/admin/history", label: "История", Icon: HistoryIcon },
    ],
  },
];

// The student-facing catalogue, which admins browse too. It leaves the area, and says so.
const CATALOGUE = [
  { to: "/teams", label: "Команды", Icon: TeamsIcon },
  { to: "/students", label: "Студенты", Icon: StudentIcon },
];

const SECTIONS = SECTION_GROUPS.flatMap((group) => group.items);

const sectionFor = (pathname) => {
  const path = pathname.replace(/\/+$/, "") || "/";
  return SECTIONS.find((section) => (section.end ? path === section.to : path.startsWith(section.to)));
};

const navClass = ({ isActive }) => (isActive ? "admin-nav-item is-active" : "admin-nav-item");

/**
 * The admin area's own frame (#68), the same as core's: a topbar that says which selection this is
 * and where it stands, a sidebar of sections, and the section below with its name said once.
 *
 * Who may open it is the router's business: `RequireAdmin` already answers everyone else with
 * «Недостаточно прав» and holds a loading screen until identity is known.
 *
 * The overview is loaded here rather than by its page: the «Состав» badge needs the same answer,
 * and reloading it on every section switch is what keeps the badge true after work on the board.
 * The overview page reads it through the outlet context instead of asking again.
 */
const AdminLayout = () => {
  const { pathname } = useLocation();
  const overview = useAdminOverview(pathname);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navRef = useRef(null);
  const menuButtonRef = useRef(null);

  const section = sectionFor(pathname);
  const shortTeams = overview.overview?.teams?.incomplete ?? 0;

  // A chosen section closes the drawer — whichever way it was chosen.
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Focus follows the drawer: into it when it opens, back to the button that opened it when it
  // closes. Done after the render, because until then the button is still inert.
  const wasDrawerOpen = useRef(false);
  useEffect(() => {
    if (isDrawerOpen) {
      navRef.current?.querySelector("a")?.focus();
    } else if (wasDrawerOpen.current) {
      menuButtonRef.current?.focus();
    }
    wasDrawerOpen.current = isDrawerOpen;
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    // From 900px the sidebar is back in place; a drawer left «open» would keep the page inert.
    const wide = window.matchMedia("(min-width: 900px)");
    const closeWhenWide = (event) => {
      if (event.matches) setIsDrawerOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    wide.addEventListener("change", closeWhenWide);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      wide.removeEventListener("change", closeWhenWide);
    };
  }, [isDrawerOpen]);

  // An open drawer is modal: the bar and the page behind the scrim leave the tab order and the
  // accessibility tree, so neither the keyboard nor a screen reader wanders off behind it.
  // `aria-modal` would need the drawer to be a dialog, which would cost it its navigation landmark.
  const behindDrawer = isDrawerOpen ? { inert: "" } : {};

  const renderItem = ({ to, label, Icon, end, countsShortTeams }) => (
    <NavLink key={to} to={to} end={end} className={navClass}>
      <Icon />
      <span className="admin-nav-label">{label}</span>
      {countsShortTeams && shortTeams > 0 && (
        <span className="admin-nav-count" aria-label={`команд, которым не хватает людей: ${shortTeams}`}>
          {shortTeams}
        </span>
      )}
    </NavLink>
  );

  return (
    <div className={`admin-shell${isDrawerOpen ? " is-drawer-open" : ""}`}>
      <header className="admin-topbar" {...behindDrawer}>
        <button
          type="button"
          ref={menuButtonRef}
          className="admin-icon-button admin-menu-button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Открыть меню разделов"
          aria-controls="admin-nav"
          aria-expanded={isDrawerOpen}
        >
          <MenuIcon />
        </button>

        <Link to="/admin" className="admin-brand" aria-label="Набор команд — обзор">
          <ConsoleMark />
          <span className="admin-brand-text" aria-hidden="true">
            <span className="admin-brand-name">Набор команд</span>
            <span className="admin-brand-sub">ПД · ЮФУ ФИИТ</span>
          </span>
        </Link>

        <SelectionPill />

        <div className="admin-topbar-actions">
          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>

      <div className="admin-body">
        <nav id="admin-nav" ref={navRef} className="admin-nav" aria-label="Разделы администрирования">
          <button
            type="button"
            className="admin-icon-button admin-nav-close"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Закрыть меню разделов"
          >
            <CloseIcon />
          </button>

          {SECTION_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <p className="admin-nav-heading">{group.label}</p>
              {group.items.map(renderItem)}
            </div>
          ))}

          <div className="admin-nav-group">
            <p className="admin-nav-heading">Каталог</p>
            {CATALOGUE.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className="admin-nav-item">
                <Icon />
                <span className="admin-nav-label">{label}</span>
                <span className="admin-nav-outgoing" title="Откроется студенческий раздел">
                  <OutgoingIcon />
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {isDrawerOpen && (
          <div className="admin-scrim" aria-hidden="true" onClick={() => setIsDrawerOpen(false)} />
        )}

        <main className="admin-main admin-area" {...behindDrawer}>
          {section && <h1 className="admin-title">{section.label}</h1>}
          <Outlet context={overview} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
