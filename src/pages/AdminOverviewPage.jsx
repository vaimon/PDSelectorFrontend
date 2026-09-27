import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import { fetchBoard } from "../api/apiBoard";
import { fetchSelectionHistory } from "../api/apiAdmin";
import GapList from "../components/overview/GapList";
import PoolBalance from "../components/overview/PoolBalance";
import StatsStrip from "../components/overview/StatsStrip";
import TrajectoryChart from "../components/overview/TrajectoryChart";
import { useIdentity } from "../context/identityContext";
import useHandOver from "../hooks/useHandOver";
import { changeSinceYesterday, forecast, formatDay, overTargetCount, poolBalance } from "../utils/overview";
import { plural } from "../utils/composition";
import { describeSelectionWindow } from "../utils/selectionWindow";
import "./AdminOverviewPage.css";

/**
 * One read of something the page shows. Each section waits for its own: a history that failed to
 * load takes the chart away, not the numbers under it.
 */
const useLoad = (load, label) => {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(`Не удалось загрузить ${label}:`, error);
        setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [load, label]);

  return state;
};

/** Which years' pool is smaller than their open places — the one thing no placement fixes. */
const shortYear = (board) => {
  if (!board) return null;
  const { firstYear, secondYear } = poolBalance(board);
  const first = firstYear.pool < firstYear.places;
  const second = secondYear.pool < secondYear.places;
  if (first && second) return "обоих курсах";
  if (first) return "1 курсе";
  if (second) return "2 курсе";
  return null;
};

const Verdict = ({ overview, history, board, state, projection, opensNote }) => {
  const { teams, students } = overview;
  const delta = history ? changeSinceYesterday(history.days) : null;
  const year = shortYear(board);

  let sentence = null;
  if (state === "handed-over") {
    sentence = <>Набор передан в кабинет ПД: числа здесь больше не меняются.</>;
  } else if (state === "upcoming") {
    sentence = <>Набор ещё не открыт: {opensNote}. График начнётся с первого дня.</>;
  } else if (state === "closed") {
    sentence = (
      <>
        Студенты больше не могут менять состав, вы — можете.{" "}
        <b>{students.withoutTeam} {plural(students.withoutTeam, ["человек", "человека", "человек"])} без команды</b>,{" "}
        {teams.incomplete} {plural(teams.incomplete, ["команде", "командам", "командам"])} не хватает людей.
        {year && <> На {year} свободных людей меньше, чем мест: часть команд придётся расформировать и раздать людей вручную.</>}
      </>
    );
  } else if (projection || year) {
    sentence = (
      <>
        {projection && (
          <>
            При темпе последней недели к {formatDay(projection.endDate)} соберутся около{" "}
            <b>{Math.round(projection.projected)} из {teams.total}</b>.{" "}
          </>
        )}
        {year && <>{projection ? "Но на" : "На"} {year} свободных людей меньше, чем мест, — все {teams.total} так не собрать.</>}
      </>
    );
  }

  return (
    <div className="overview-verdict">
      <p className="overview-verdict-main">
        <span className="overview-hero">{teams.complete}</span>
        <span className="overview-hero-of">из {teams.total} {plural(teams.total, ["команды", "команд", "команд"])} собраны</span>
        {delta != null && delta !== 0 && (
          <span className={`overview-delta${delta < 0 ? " is-down" : ""}`}>
            {delta > 0 ? `+${delta}` : `−${-delta}`} со вчера
          </span>
        )}
      </p>
      {sentence && <p className="overview-verdict-sub">{sentence}</p>}
    </div>
  );
};

/**
 * «Обзор» (#69): will every team reach its target by the close, and what to do today to get there.
 *
 * Top down: how many teams are complete and where the count is heading; the three numbers the
 * organiser keeps asking about; who is short of whom; and whether the pool can fill it. The
 * overview comes from the shell, which loads it for the «Состав» badge too; the history and the
 * board are this page's own.
 */
const AdminOverviewPage = () => {
  const { overview, loading, error, missing } = useOutletContext();
  const { activeTrack } = useIdentity();
  const { handedOver } = useHandOver();
  const history = useLoad(fetchSelectionHistory, "историю набора");
  const board = useLoad(fetchBoard, "состав");

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

  const selection = describeSelectionWindow(activeTrack);
  const state = handedOver ? "handed-over" : selection?.state ?? "open";
  const projection = history.data ? forecast(history.data, state === "open") : null;

  const renderChart = () => {
    if (history.loading) return <p className="overview-empty">Загружаем историю набора…</p>;
    if (history.error) return <p className="overview-empty is-error">Не удалось загрузить историю набора.</p>;
    if (history.data.days.length === 0) return <p className="overview-empty">График начнётся с первого дня набора.</p>;
    return <TrajectoryChart history={history.data} projection={projection} isToday={state === "open"} />;
  };

  const renderBoardSections = () => {
    if (board.loading) return <p className="overview-empty">Загружаем команды…</p>;
    if (board.error) return <p className="overview-empty is-error">Не удалось загрузить команды.</p>;
    return (
      <div className="overview-gap">
        <GapList board={board.data} />
        <div className="overview-side">
          <PoolBalance board={board.data} />
          {state === "closed" && (
            <section className="admin-section overview-panel overview-next" aria-labelledby="next-title">
              <h2 id="next-title">Перед передачей в кабинет ПД</h2>
              <p>
                Передача замораживает набор для всех, включая администраторов. Сначала доведите
                состав: команды, которым не хватает людей, и люди без команды — выше.
              </p>
              <Link className="overview-next-link" to="/admin/settings">К передаче в «Настройках»</Link>
            </section>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="overview">
      <section className="admin-section overview-panel overview-trajectory" aria-label="Как собираются команды">
        <Verdict
          overview={overview}
          history={history.data}
          board={board.data}
          state={state}
          projection={projection}
          opensNote={selection?.note}
        />
        {renderChart()}
      </section>

      <StatsStrip overview={overview} overTarget={board.data ? overTargetCount(board.data) : 0} />

      {renderBoardSections()}
    </div>
  );
};

export default AdminOverviewPage;
