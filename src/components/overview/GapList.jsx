import { Link } from "react-router-dom";

import CourseSlots from "../board/CourseSlots";
import { gapBuckets, missingLabel, teamsLabel } from "../../utils/overview";

/**
 * «Кому не хватает людей» (#69): the short teams, nearest to done first, each a way into the board
 * at that team. The bucket says how many people are missing; the pips say of which year (#78).
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
            {bucket.teams.map(({ team, lead }) => (
              <li key={team.id}>
                <Link className="gap-row" to={`/admin/board#team-${team.id}`}>
                  <span className="gap-row-main">
                    <span className="gap-row-name">{team.name}</span>
                    {lead && <span className="gap-row-sub">тимлид {lead.name}</span>}
                  </span>
                  <span className="gap-slots">
                    <CourseSlots team={team} />
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
