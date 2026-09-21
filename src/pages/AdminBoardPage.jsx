import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import LeadPicker from "../components/board/LeadPicker";
import MovePicker from "../components/board/MovePicker";
import TargetsDialog from "../components/board/TargetsDialog";
import { changeTeamLead, dissolveTeam, fetchBoard, moveStudent, setTeamTargets } from "../api/apiBoard";
import { useNotifications } from "../context/notificationContext";
import useHandOver from "../hooks/useHandOver";
import {
  STATUS_LABELS,
  applyDissolve,
  applyMove,
  canJoin,
  counterFor,
  countersLine,
  filterPool,
  filterTeams,
  courseLabel,
  hasOwnTargets,
} from "../utils/board";
import "./AdminBoardPage.css";

const EMPTY_FILTER = { text: "", shortOnly: false, placesFor: "", sort: "status" };

const studentMeta = (student) => `${courseLabel(student.course)}${student.group ? `, группа ${student.group}` : ""}`;

/**
 * «Состав» (#55): the selection's teams and the students without one, and every change an
 * organiser makes to them after the close — moves, a team's own targets, a new lead, dissolving.
 *
 * A change shows at once and is then replaced by the server's answer, which is the whole board with
 * fresh versions for the next action. A refusal puts the board back as it was and reloads it: the
 * reason has already been said by the shared client, and `STALE_VERSION` — another admin changed
 * the team first — ends the same way, with the other admin's change on screen.
 *
 * The questions a move needs (over target? who leads next? dissolve?) are asked before anything is
 * sent, from the same numbers the server will check; if it still refuses, that was a race. A move
 * starts from «Переместить в…» or from dragging a row (#56) — both end in the same `advance`.
 *
 * The last move can be taken back until the next action on the board. Only a move: a dissolved
 * team, new targets or a new lead are confirmed before they happen instead.
 */
const AdminBoardPage = () => {
  const { handedOver } = useHandOver();
  const { notify } = useNotifications();

  const [board, setBoard] = useState(null);
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  // The move being prepared: who, from where, to where, and what has been answered so far.
  const [move, setMove] = useState(null);
  const [targetsOf, setTargetsOf] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  // What is being dragged lives in a ref: the first `dragover` fires before a state update renders,
  // and a target that does not call preventDefault on it refuses the drop. State only draws it.
  const dragging = useRef(null);
  const [dragged, setDragged] = useState(null);
  const [dropOn, setDropOn] = useState(null);
  const loadId = useRef(0);
  // Dragging is offered to a mouse or a trackpad only, by choice (#56): a long-press drag on a phone
  // fights the page's scrolling, and a keyboard has nothing to drag with — the picker is the way there.
  const finePointer = useMemo(() => window.matchMedia?.("(any-pointer: fine)").matches ?? false, []);

  const load = useCallback(async () => {
    const id = ++loadId.current;
    try {
      const next = await fetchBoard();
      if (id === loadId.current) {
        setBoard(next);
        setState("ready");
      }
      return next;
    } catch (error) {
      if (id === loadId.current) {
        // Between two selections there is no board to show, and that is an answer, not a failure.
        setState(error.response?.status === 404 ? "missing" : "error");
      }
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Holds every action off until `work` is done, however many requests it takes. Any action ends the
   * chance to undo the move before it: an undo is only ever of the last thing done.
   */
  const whileBusy = async (work) => {
    setBusy(true);
    setLastMove(null);
    try {
      return await work();
    } finally {
      setBusy(false);
    }
  };

  /**
   * Shows `optimistic` at once, then the server's board. On a refusal it puts the old one back,
   * reloads, and answers `{ refused, reloaded }` — the reloaded board, or null if that failed too.
   */
  const run = async (before, optimistic, request, successText) => {
    loadId.current += 1; // a reload still in flight must not land over this change
    setBoard(optimistic);
    try {
      const fresh = await request();
      setBoard(fresh);
      if (successText) notify({ type: "success", text: successText });
      return fresh;
    } catch (error) {
      console.error("Доска не приняла изменение:", error);
      setBoard(before);
      return { refused: true, reloaded: await load() };
    }
  };

  const send = ({ student, from, to, allowOverTarget = false, newLeadId = null, dissolve = false }) => whileBusy(async () => {
    let current = board;
    let origin = from;
    if (dissolve) {
      current = await run(current, applyDissolve(current, from.id),
        () => dissolveTeam(from.id, { version: from.version }),
        to ? null : `Команда «${from.name}» расформирована`);
      if (current.refused) return;
      if (!to) {
        setLastMove({ student, originName: from.name, destinationId: null, destinationName: null, dissolved: true });
        return;
      }
      origin = null;
    }
    // Two requests, and the first has already gone through: if the second does not, the page says
    // where that left the student instead of letting the confirmation («…перейдёт в команду») stand.
    const halfDone = () => {
      if (dissolve) {
        notify({ type: "info", text: `Команда «${from.name}» расформирована, ${student.name} — без команды` });
      }
    };

    const target = to && current.teams.find((team) => team.id === to.id);
    if (to && !target) {
      notify({ type: "info", text: `Команды «${to.name}» уже нет на доске` });
      halfDone();
      await load();
      return;
    }
    const moved = await run(
      current,
      applyMove(current, { studentId: student.id, fromTeamId: origin?.id ?? null, toTeamId: to?.id ?? null, newLeadId }),
      () => moveStudent({
        studentId: student.id,
        fromTeamId: origin?.id ?? null,
        fromVersion: origin?.version ?? null,
        toTeamId: target?.id ?? null,
        toVersion: target?.version ?? null,
        allowOverTarget,
        newLeadId,
      }),
      target ? `${student.name} — в команде «${target.name}»` : `${student.name} — без команды`,
    );
    if (moved.refused) {
      halfDone();
      return;
    }
    setLastMove({
      student,
      originId: dissolve ? null : origin?.id ?? null,
      originName: from?.name ?? null,
      destinationId: target?.id ?? null,
      destinationName: target?.name ?? null,
      successorName: newLeadId == null ? null : from.members.find((member) => member.id === newLeadId)?.name,
      dissolved: dissolve,
    });
  });

  /**
   * The last move, backwards: from where the student is now to where they came from, with the
   * versions both teams have now. If the board has moved on under it, there is nothing to undo.
   */
  const undoLast = () => whileBusy(async () => {
    const last = lastMove;
    const holder = last.destinationId == null ? null : board.teams.find((team) => team.id === last.destinationId);
    const stillThere = last.destinationId == null
      ? board.pool.some((student) => student.id === last.student.id)
      : Boolean(holder?.members.some((member) => member.id === last.student.id));
    const origin = last.originId == null ? null : board.teams.find((team) => team.id === last.originId);
    if (!stillThere || (last.originId != null && !origin)) {
      notify({ type: "info", text: "Состав изменился после перемещения — отменять уже нечего" });
      await load();
      return;
    }
    await run(
      board,
      applyMove(board, { studentId: last.student.id, fromTeamId: holder?.id ?? null, toTeamId: origin?.id ?? null }),
      () => moveStudent({
        studentId: last.student.id,
        fromTeamId: holder?.id ?? null,
        fromVersion: holder?.version ?? null,
        toTeamId: origin?.id ?? null,
        toVersion: origin?.version ?? null,
        // The composition it puts back existed a moment ago, over target or not; the versions of both
        // teams guarantee that nothing else changed since, and without this a move out of an
        // over-target team — the usual way to fix one — could never be undone.
        allowOverTarget: true,
        newLeadId: null,
      }),
      "Перемещение отменено",
    );
  });

  /**
   * One question at a time: the target, then the lead. Each answer comes back here, so whatever was
   * asked before is closed first — a question left open would sit on top of the next one.
   */
  const advance = (next) => {
    const { student, from, to } = next;
    setConfirmation(null);
    if (to && !next.allowOverTarget && !canJoin(to, student.course)) {
      setMove(null);
      setConfirmation({
        heading: "Переместить сверх цели?",
        description: `В команде «${to.name}» уже ${counterFor(to, student.course)}. `
          + `${student.name} будет в ней сверх цели, и команда станет «Сверх цели».`,
        confirmText: "Переместить",
        onConfirm: () => advance({ ...next, allowOverTarget: true }),
      });
      return;
    }
    if (from && from.leadId === student.id && next.newLeadId == null && !next.dissolve) {
      if (from.members.length > 1) {
        setMove({ ...next, step: "lead" });
        return;
      }
      setMove(null);
      setConfirmation({
        heading: `Расформировать команду «${from.name}»?`,
        description: `${student.name} — её единственный участник и тимлид. Команда исчезнет, `
          + "её заявки и приглашения удалятся"
          + (to ? `, а ${student.name} перейдёт в команду «${to.name}».` : "."),
        confirmText: "Расформировать",
        onConfirm: () => advance({ ...next, dissolve: true }),
      });
      return;
    }
    setMove(null);
    send(next);
  };

  const askLead = (team, member) => setConfirmation({
    heading: "Назначить тимлидом?",
    description: `${member.name} станет тимлидом команды «${team.name}», `
      + `${team.members.find((other) => other.id === team.leadId)?.name ?? "прежний тимлид"} останется в ней участником.`,
    confirmText: "Назначить",
    onConfirm: () => whileBusy(async () => {
      setConfirmation(null);
      await run(board, board, () => changeTeamLead(team.id, { version: team.version, studentId: member.id }),
        `${member.name} — тимлид команды «${team.name}»`);
    }),
  });

  const askDissolve = (team) => setConfirmation({
    heading: `Расформировать команду «${team.name}»?`,
    description: `Команда исчезнет, её заявки и приглашения удалятся, а все участники (${team.members.length}) `
      + "окажутся без команды.",
    confirmText: "Расформировать",
    onConfirm: () => whileBusy(async () => {
      setConfirmation(null);
      await run(board, applyDissolve(board, team.id), () => dissolveTeam(team.id, { version: team.version }),
        `Команда «${team.name}» расформирована`);
    }),
  });

  // The dialog stays open until the server takes the targets: a refusal must not throw away what was
  // typed. It is handed the team from the reloaded board, so a second try carries the current version.
  const saveTargets = (targets) => whileBusy(async () => {
    const team = targetsOf;
    const result = await run(board, board, () => setTeamTargets(team.id, { version: team.version, ...targets }),
      `Цели команды «${team.name}» сохранены`);
    setTargetsOf(result.refused ? result.reloaded?.teams.find((candidate) => candidate.id === team.id) ?? null : null);
  });

  const setField = (name, value) => setFilter((current) => ({ ...current, [name]: value }));

  if (state === "loading") return <p className="admin-state">Загружаем состав…</p>;
  if (state === "missing") {
    return <p className="admin-state">Набор не настроен: сейчас нет активного набора, и составлять нечего.</p>;
  }
  if (state === "error" && !board) {
    return <p className="admin-state admin-state--error">Не удалось загрузить состав. Обновите страницу.</p>;
  }

  const locked = handedOver;
  const teams = filterTeams(board.teams, { ...filter, placesFor: filter.placesFor ? Number(filter.placesFor) : null });
  const pool = filterPool(board.pool, filter.text);

  // A row to drag, and a place to drop it: a team card or the pool, never where the student already is.
  const dragFrom = (student, from) => (locked || !finePointer ? {} : {
    draggable: !busy,
    onDragStart: (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(student.id)); // Firefox starts no drag without data
      dragging.current = { student, from };
      setDragged(student.id);
    },
    onDragEnd: () => {
      dragging.current = null;
      setDragged(null);
      setDropOn(null);
    },
  });

  const dropInto = (key, to) => (locked ? {} : {
    onDragOver: (event) => {
      const current = dragging.current;
      if (!current || busy || (current.from?.id ?? null) === (to?.id ?? null)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dropOn !== key) setDropOn(key);
    },
    onDragLeave: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setDropOn(null);
    },
    onDrop: (event) => {
      const current = dragging.current;
      dragging.current = null;
      setDragged(null);
      setDropOn(null);
      if (!current || busy) return;
      event.preventDefault();
      advance({ student: current.student, from: current.from, to });
    },
  });

  const rowClass = (student) => (dragged === student.id ? "board-student is-dragging" : "board-student");
  const dropClass = (base, key) => (dropOn === key ? `${base} is-drop-target` : base);

  const undoNote = (last) => {
    const where = last.destinationName ? `в команде «${last.destinationName}»` : "без команды";
    if (last.dissolved) {
      return `${last.student.name} — ${where}. Команда «${last.originName}» расформирована, это перемещение не отменить.`;
    }
    const back = last.successorName
      ? ` После отмены ${last.student.name} вернётся в команду «${last.originName}» участником, тимлидом останется ${last.successorName}.`
      : "";
    return `${last.student.name} — ${where}.${back}`;
  };

  const moveButton = (student, from) => !locked && (
    <button
      type="button"
      className="board-action"
      disabled={busy}
      onClick={() => setMove({ student, from, step: "pick" })}
    >
      Переместить в…
    </button>
  );

  return (
    <section className="admin-section" aria-labelledby="admin-board-title">
      <div className="admin-section-head">
        <p className="admin-section-kicker">Состав</p>
        <h2 id="admin-board-title">Команды набора «{board.trackName}»</h2>
      </div>

      {locked && <p className="admin-locked">Набор передан — правки в кабинете ПД.</p>}

      <div className="admin-toolbar board-toolbar">
        <input
          type="search"
          className="board-search"
          value={filter.text}
          onChange={(event) => setField("text", event.target.value)}
          aria-label="Поиск по студентам и командам"
          placeholder="Студент или команда"
        />
        <label className="board-check">
          <input
            type="checkbox"
            checked={filter.shortOnly}
            onChange={(event) => setField("shortOnly", event.target.checked)}
          />
          Только несобранные
        </label>
        <label className="board-select">
          Есть места
          <select value={filter.placesFor} onChange={(event) => setField("placesFor", event.target.value)}>
            <option value="">для любого курса</option>
            <option value="1">для 1 курса</option>
            <option value="2">для 2 курса</option>
          </select>
        </label>
        <div className="admin-toggle" role="group" aria-label="Порядок команд">
          <button type="button" aria-pressed={filter.sort === "status"} onClick={() => setField("sort", "status")}>
            По статусу
          </button>
          <button type="button" aria-pressed={filter.sort === "name"} onClick={() => setField("sort", "name")}>
            По названию
          </button>
        </div>
      </div>

      <p className="board-summary">
        Команд: {teams.length} из {board.teams.length} · без команды: {board.pool.length}
        {" "}· цель набора: 1 курс {board.firstYearTarget}, 2 курс {board.secondYearTarget}
      </p>

      {lastMove && !locked && (
        <p className="board-undo">
          <span>{undoNote(lastMove)}</span>
          {!lastMove.dissolved && (
            <button type="button" disabled={busy} onClick={undoLast}>Отменить</button>
          )}
        </p>
      )}

      <div className="board">
        <aside
          className={dropClass("board-pool", "pool")}
          aria-labelledby="board-pool-title"
          {...dropInto("pool", null)}
        >
          <h3 id="board-pool-title">Без команды · {board.pool.length}</h3>
          {pool.length === 0 ? (
            <p className="board-empty">{board.pool.length === 0 ? "Все студенты в командах." : "Никого не нашлось."}</p>
          ) : (
            <ul className="board-students">
              {pool.map((student) => (
                <li key={student.id} className={rowClass(student)} {...dragFrom(student, null)}>
                  <div className="board-student-main">
                    <span className="board-student-name">{student.name}</span>
                    <span className="board-student-meta">{studentMeta(student)}</span>
                  </div>
                  {moveButton(student, null)}
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="board-teams">
          {teams.length === 0 && (
            <p className="board-empty">{board.teams.length === 0 ? "В наборе пока нет команд." : "Под фильтр не подходит ни одна команда."}</p>
          )}
          {teams.map((team) => (
            <article
              key={team.id}
              className={dropClass(`board-team is-${team.status.toLowerCase()}`, team.id)}
              {...dropInto(team.id, team)}
            >
              <header className="board-team-head">
                <h3>{team.name}</h3>
                <p className="board-team-status">
                  <span className="board-status">{STATUS_LABELS[team.status]}</span>
                  {hasOwnTargets(team) && <span className="board-badge">свои цели</span>}
                </p>
                <p className="board-counters">{countersLine(team)}</p>
              </header>

              <ul className="board-students">
                {team.members.map((member) => (
                  <li key={member.id} className={rowClass(member)} {...dragFrom(member, team)}>
                    <div className="board-student-main">
                      <span className="board-student-name">
                        {member.name}
                        {member.id === team.leadId && <span className="board-lead">тимлид</span>}
                      </span>
                      <span className="board-student-meta">{studentMeta(member)}</span>
                    </div>
                    {!locked && (
                      <div className="board-student-actions">
                        {moveButton(member, team)}
                        {member.id !== team.leadId && (
                          <button
                            type="button"
                            className="board-action"
                            disabled={busy}
                            onClick={() => askLead(team, member)}
                          >
                            Назначить тимлидом
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {!locked && (
                <footer className="board-team-actions">
                  <button type="button" className="board-action" disabled={busy} onClick={() => setTargetsOf(team)}>
                    Исключение для команды
                  </button>
                  <button
                    type="button"
                    className="board-action board-danger"
                    disabled={busy}
                    onClick={() => askDissolve(team)}
                  >
                    Расформировать
                  </button>
                </footer>
              )}
            </article>
          ))}
        </div>
      </div>

      {move?.step === "pick" && (
        <MovePicker
          board={board}
          move={move}
          onPick={(to) => advance({ ...move, to })}
          onCancel={() => setMove(null)}
        />
      )}
      {move?.step === "lead" && (
        <LeadPicker
          team={move.from}
          leaving={move.student}
          onPick={(newLeadId) => advance({ ...move, newLeadId })}
          onCancel={() => setMove(null)}
        />
      )}
      {targetsOf && (
        <TargetsDialog
          team={targetsOf}
          board={board}
          busy={busy}
          onSave={saveTargets}
          onCancel={() => setTargetsOf(null)}
        />
      )}
      <ConfirmDialog
        request={confirmation}
        onConfirm={() => confirmation.onConfirm()}
        onCancel={() => setConfirmation(null)}
        busy={busy}
      />
    </section>
  );
};

export default AdminBoardPage;
