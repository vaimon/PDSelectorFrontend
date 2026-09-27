import { Link } from "react-router-dom";

import { describeNeed, gapBuckets, missingLabel, teamsLabel } from "../../utils/overview";

/** Filled places, open ones, and any taken over the target, for one year of one team. */
const Pips = ({ have, target }) => (
  <span className="gap-pips">
    {Array.from({ length: Math.max(have, target) }, (_, index) => (
      <span
        key={index}
        className={`gap-pip${index >= have ? " is-open" : index >= target ? " is-over" : ""}`}
      />
    ))}
  </span>
);

/**
 * «Кому не хватает людей» (#69): the short teams, nearest to done first, each a way into the board
 * at that team. The pips are drawn for the eye; the row's words say the same thing — «нужно 2 ×
 * 1 курс» — so nobody has to count dots.
 */
const GapList = ({ board }) => {
  const buckets = gapBuckets(board);

  return (
    <section className="admin-section overview-panel gap-list" aria-labelledby="gap-title">
      <header className="overview-section-head">
        <h2 id="gap-title">Кому не хватает людей</h2>
        <Link to="/admin/board">Собрать в «Составе» →</Link>
      </header>

      {buckets.length === 0 ? (
        <p className="overview-empty">Все команды собраны.</p>
      ) : buckets.map((bucket) => (
        <div key={bucket.missing}>
          <p className="gap-bucket">
            <span>{missingLabel(bucket.missing)}</span>
            <span className="overview-num">{teamsLabel(bucket.teams.length)}</span>
          </p>
          <ul className="gap-rows">
            {bucket.teams.map(({ team, lead, needFirst, needSecond }) => (
              <li key={team.id}>
                <Link className="gap-row" to={`/admin/board#team-${team.id}`}>
                  <span className="gap-row-main">
                    <span className="gap-row-name">{team.name}</span>
                    <span className="gap-row-sub">
                      {lead ? `тимлид ${lead.name} · ` : ""}
                      <span className="gap-need">{describeNeed(needFirst, needSecond)}</span>
                    </span>
                  </span>
                  <span className="gap-slots" aria-hidden="true">
                    <span className="gap-slot"><em>1 к</em><Pips have={team.firstYears} target={team.firstYearTarget} /></span>
                    <span className="gap-slot"><em>2 к</em><Pips have={team.secondYears} target={team.secondYearTarget} /></span>
                  </span>
                  <svg className="gap-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};

export default GapList;
