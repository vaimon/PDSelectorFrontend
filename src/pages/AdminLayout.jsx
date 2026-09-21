import { NavLink, Outlet } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";
import { useIdentity } from "../context/identityContext";
import useHandOver from "../hooks/useHandOver";
import { describeSelectionWindow, selectionClosedReason } from "../utils/selectionWindow";
import "./AdminLayout.css";

/**
 * The frame of the admin area: which selection this is, whether it can still be changed, and the
 * section below it. Sections are routes under `/admin` — настройки (#47), участники и команды
 * (#48), доступ (#49). The menu below lists the ones that exist; each later section adds an
 * item to it.
 *
 * Who may open it is the router's business: `RequireAdmin` already answers everyone else with
 * «Недостаточно прав» and holds a loading screen until identity is known.
 */
const sectionClass = ({ isActive }) => (isActive ? "admin-section-link is-active" : "admin-section-link");

const AdminLayout = () => {
  const { activeTrack } = useIdentity();
  const { handedOver, note } = useHandOver();
  const selection = describeSelectionWindow(activeTrack);

  return (
    <>
      <Navbar />
      <main className="page-container admin-area">
        <header className="admin-head">
          <p className="admin-kicker">Проектная деятельность</p>
          <h1>Администрирование</h1>
          {/* Nothing about the window once the selection is handed over: «идёт до 4 октября»
              right above «передан в кабинет ПД» tells the reader two different things. */}
          {selection && !handedOver && (
            <p className="admin-lead">
              {selection.state === "open"
                ? `Идёт набор «${selection.name}», ${selection.note}.`
                // «Идёт набор — завершён вчера» contradicts itself; this is the sentence every
                // disabled control in the app already gives for the same state.
                : selectionClosedReason(activeTrack)}
            </p>
          )}
        </header>

        {/* Once for the area, not once per section: after the hand-over nothing below can be
            changed, and #47–#49 read the same hook instead of each deciding what that means. */}
        {handedOver && <p className="admin-banner">{note}</p>}

        <nav className="admin-sections" aria-label="Разделы администрирования">
          {/* `end` on the overview only: it lives at /admin itself, so without it every section
              below would light it up as well. */}
          <NavLink to="/admin" end className={sectionClass}>Обзор</NavLink>
          <NavLink to="/admin/people" className={sectionClass}>Участники и команды</NavLink>
          <NavLink to="/admin/settings" className={sectionClass}>Настройки</NavLink>
        </nav>

        <Outlet />
      </main>
    </>
  );
};

export default AdminLayout;
