import { poolBalance } from "../../utils/overview";

const ToneIcon = ({ tone }) => (
  <svg className="balance-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {tone === "ok" ? (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </>
    ) : (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4M12 17h.01" />
      </>
    )}
  </svg>
);

const Year = ({ title, stat, year }) => {
  const scale = Math.max(1, year.pool, year.places);
  return (
    <div className="balance-year">
      <h3>{title}</h3>
      <p className="balance-row">
        <span>без команды</span>
        <span className="balance-track" aria-hidden="true">
          <span className="balance-bar is-people" style={{ width: `${(year.pool / scale) * 100}%` }} />
        </span>
        <b className="overview-num" data-stat={`pool-${stat}`}>{year.pool}</b>
      </p>
      <p className="balance-row">
        <span>свободных мест</span>
        <span className="balance-track" aria-hidden="true">
          <span className="balance-bar is-places" style={{ width: `${(year.places / scale) * 100}%` }} />
        </span>
        <b className="overview-num" data-stat={`places-${stat}`}>{year.places}</b>
      </p>
      <p className={`balance-verdict is-${year.verdict.tone}`}>
        <ToneIcon tone={year.verdict.tone} />
        <span>{year.verdict.text}</span>
      </p>
    </div>
  );
};

/**
 * «Хватит ли свободных людей» (#69): per year, the people without a team against the places the
 * short teams have for them. It answers what the board alone does not — whether filling every
 * team is possible at all, or which year needs new teams or places over the target.
 */
const PoolBalance = ({ board }) => {
  const { firstYear, secondYear } = poolBalance(board);
  return (
    <section className="admin-section overview-panel balance" aria-labelledby="balance-title">
      <header className="overview-section-head">
        <h2 id="balance-title">Хватит ли свободных людей</h2>
      </header>
      <div className="balance-years">
        <Year title="1 курс" stat="first-year" year={firstYear} />
        <Year title="2+ курс" stat="second-year" year={secondYear} />
      </div>
    </section>
  );
};

export default PoolBalance;
