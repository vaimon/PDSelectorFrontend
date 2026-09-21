import { Link } from "react-router-dom";

import { useIdentity } from "../context/identityContext";
import useAdminOverview from "../hooks/useAdminOverview";
import "./AdminOverviewPage.css";

const Stat = ({ value, label, hint, alert, to }) => {
  const body = (
    <>
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
      {hint && <span className="admin-stat-hint">{hint}</span>}
    </>
  );
  const className = alert ? "admin-stat admin-stat--alert" : "admin-stat";
  return to
    ? <Link className={`${className} admin-stat--link`} to={to}>{body}</Link>
    : <div className={className}>{body}</div>;
};

/**
 * Where the selection stands, in numbers: who registered, how the teams are filling up, and what
 * is waiting for somebody to answer. The landing section of the admin area.
 */
const AdminOverviewPage = () => {
  const { activeTrack } = useIdentity();
  const { overview, loading, error, missing } = useAdminOverview();

  const renderBody = () => {
    if (loading) return <p className="admin-state">Загружаем состояние набора…</p>;
    if (missing) {
      return (
        <p className="admin-state">
          Набор не настроен: сейчас нет активного набора, и считать пока нечего.
        </p>
      );
    }
    if (error) {
      return (
        <p className="admin-state admin-state--error">
          Не удалось загрузить состояние набора. Обновите страницу.
        </p>
      );
    }

    const { students, teams, applications } = overview;
    const stale = applications.staleRequests + applications.staleInvites;

    return (
      <div className="admin-groups">
        <article className="admin-group">
          <h3>Участники</h3>
          <div className="admin-stats">
            <Stat value={students.total} label="зарегистрировались" />
            <Stat value={students.firstYear} label="1 курс" />
            <Stat value={students.secondYear} label="2 курс и старше" />
          </div>
          <div className="admin-stats">
            <Stat value={students.withTeam} label="в командах" />
            <Stat
              value={students.withoutTeam}
              label="без команды"
              hint={`1 курс — ${students.firstYearWithoutTeam}, 2 курс и старше — ${students.secondYearWithoutTeam}`}
            />
          </div>
        </article>

        <article className="admin-group">
          <h3>Команды</h3>
          <div className="admin-stats">
            <Stat value={teams.total} label="всего" />
            <Stat value={teams.complete} label="собраны" />
            <Stat value={teams.incomplete} label="кого-то не хватает" hint="собрать в «Составе»" to="/admin/board" />
          </div>
        </article>

        <article className="admin-group">
          <h3>Ждут ответа</h3>
          <div className="admin-stats">
            <Stat value={applications.pendingRequests} label="заявок от студентов" />
            <Stat value={applications.pendingInvites} label="приглашений от команд" />
            {/* The threshold comes back with the answer: the page must not name a number the
                backend could change without it — which is also why «дн.» and not «дней». */}
            <Stat
              value={stale}
              label={`лежат дольше ${applications.staleThresholdDays} дн.`}
              alert={stale > 0}
              hint={
                stale > 0
                  ? `заявок — ${applications.staleRequests}, приглашений — ${applications.staleInvites}`
                  : undefined
              }
            />
          </div>
        </article>
      </div>
    );
  };

  return (
    <section className="admin-section" aria-labelledby="admin-overview-title">
      <div className="admin-section-head">
        <p className="admin-section-kicker">Обзор</p>
        {/* The name comes from the identity, not from the answer: it is already known when the
            page opens, so the heading does not reflow a request later. */}
        <h2 id="admin-overview-title">
          Где сейчас набор{activeTrack ? `: ${activeTrack.name}` : ""}
        </h2>
      </div>
      {renderBody()}
    </section>
  );
};

export default AdminOverviewPage;
