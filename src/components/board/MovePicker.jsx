import { useState } from "react";

import Modal from "../forms/modal/Modal";
import { canJoin, counterFor, destinationsFor, courseLabel } from "../../utils/board";
import "./style.css";

/**
 * «Переместить в…»: every place a student can go, as buttons — the one way to move that works from a
 * keyboard and on a phone, and the one drag-and-drop (#56) will lean on.
 *
 * Each team shows the counter for this student's year, so the choice is made against the number that
 * matters; the teams with room come first, and a full one says it would go over target. Choosing one
 * does not move anybody yet: the page asks what it has to ask first.
 */
const MovePicker = ({ board, move, onPick, onCancel }) => {
  const [text, setText] = useState("");
  const { student, from } = move;
  const teams = destinationsFor(board, student, from?.id ?? null, text);

  return (
    <Modal show onClose={onCancel}>
      <div className="board-dialog">
        <h2 className="board-dialog-title">Куда переместить: {student.name}</h2>
        <p className="board-dialog-note">
          {courseLabel(student.course)}{student.group ? `, группа ${student.group}` : ""}
          {from ? ` · сейчас в команде «${from.name}»` : " · сейчас без команды"}.
          {" "}В новой команде неотвеченные заявки и приглашения студента закроются.
        </p>

        <input
          type="text"
          className="board-dialog-search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Найти команду"
          placeholder="Название команды"
          autoFocus
        />

        <ul className="board-destinations">
          {from && !text.trim() && (
            <li>
              <button type="button" className="board-destination" onClick={() => onPick(null)}>
                <span className="board-destination-name">Без команды</span>
                <span className="board-destination-meta">вернуть в общий список</span>
              </button>
            </li>
          )}
          {teams.map((team) => {
            const room = canJoin(team, student.course);
            return (
              <li key={team.id}>
                <button type="button" className="board-destination" onClick={() => onPick(team)}>
                  <span className="board-destination-name">{team.name}</span>
                  <span className={room ? "board-destination-meta" : "board-destination-meta is-over"}>
                    {counterFor(team, student.course)}{room ? "" : " · сверх цели"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {teams.length === 0 && text.trim() && <p className="board-dialog-note">Команд с таким названием нет.</p>}
      </div>
    </Modal>
  );
};

export default MovePicker;
