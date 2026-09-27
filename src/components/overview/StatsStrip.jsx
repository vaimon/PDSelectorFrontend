import { Link } from "react-router-dom";

const share = (part, whole) => `${whole > 0 ? (part / whole) * 100 : 0}%`;

/** A figure marked with what it counts, so the page and the smoke read the same thing. */
const Figure = ({ stat, children }) => <b className="overview-num" data-stat={stat}>{children}</b>;

/**
 * The three numbers the organiser keeps asking about (#69), each with its split drawn under it:
 * who registered, who is in a team, and how many teams are done. The shares are the bar's; the
 * words next to it carry the same figures, so the colour is never the only way to read them.
 */
const StatsStrip = ({ overview, overTarget }) => {
  const { students, teams } = overview;

  return (
    <section className="admin-section overview-panel overview-stats" aria-label="Участники и команды в цифрах">
      <div className="overview-stat">
        <p className="overview-stat-top">
          <span>Зарегистрировались</span>
          <Figure stat="registered">{students.total}</Figure>
        </p>
        <div className="overview-split" aria-hidden="true">
          <span className="is-accent" style={{ width: share(students.firstYear, students.total) }} />
          <span className="is-soft" style={{ width: share(students.secondYear, students.total) }} />
        </div>
        <p className="overview-legend">
          <span><i className="is-accent" aria-hidden="true" />1 курс <Figure stat="registered-first-year">{students.firstYear}</Figure></span>
          <span><i className="is-soft" aria-hidden="true" />2 курс и старше <Figure stat="registered-second-year">{students.secondYear}</Figure></span>
        </p>
      </div>

      <div className="overview-stat">
        <p className="overview-stat-top">
          <span>В командах</span>
          <span><Figure stat="in-teams">{students.withTeam}</Figure> <small>из {students.total}</small></span>
        </p>
        <div className="overview-split" aria-hidden="true">
          <span className="is-accent" style={{ width: share(students.withTeam, students.total) }} />
          <span className="is-warn" style={{ width: share(students.withoutTeam, students.total) }} />
        </div>
        <p className="overview-legend">
          <Link to="/admin/people">
            <i className="is-warn" aria-hidden="true" />без команды <Figure stat="without-team">{students.withoutTeam}</Figure>
          </Link>
          <span>1 курс <Figure stat="without-team-first-year">{students.firstYearWithoutTeam}</Figure></span>
          <span>2 курс и старше <Figure stat="without-team-second-year">{students.secondYearWithoutTeam}</Figure></span>
        </p>
      </div>

      <div className="overview-stat">
        <p className="overview-stat-top">
          <span>Команды собраны</span>
          <span><Figure stat="teams-complete">{teams.complete}</Figure> <small>из <span data-stat="teams-total">{teams.total}</span></small></span>
        </p>
        <div className="overview-split" aria-hidden="true">
          <span className="is-accent" style={{ width: share(teams.complete, teams.total) }} />
          <span className="is-warn" style={{ width: share(teams.incomplete, teams.total) }} />
        </div>
        <p className="overview-legend">
          <Link to="/admin/board">
            <i className="is-warn" aria-hidden="true" />не хватает людей <Figure stat="teams-short">{teams.incomplete}</Figure>
          </Link>
          {overTarget > 0 && <span>сверх цели <Figure stat="teams-over">{overTarget}</Figure></span>}
        </p>
      </div>
    </section>
  );
};

export default StatsStrip;
