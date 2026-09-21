import { useState } from "react";

import Modal from "../forms/modal/Modal";
import "../confirm-dialog/style.css";
import "./style.css";

const toField = (override) => (override == null ? "" : String(override));
const fromField = (value) => (value.trim() === "" ? null : Number(value));
const digitsOnly = (value) => value.replace(/[^0-9]/g, "");

/**
 * «Исключение для команды»: the team's own per-year targets. An empty field means the selection's
 * target, so clearing both takes the exception away.
 */
const TargetsDialog = ({ team, board, busy, onSave, onCancel }) => {
  const [first, setFirst] = useState(toField(team.firstYearOverride));
  const [second, setSecond] = useState(toField(team.secondYearOverride));

  const submit = (event) => {
    event.preventDefault();
    onSave({ firstYearTarget: fromField(first), secondYearTarget: fromField(second) });
  };

  return (
    <Modal show onClose={busy ? () => {} : onCancel}>
      <form className="board-dialog" onSubmit={submit}>
        <h2 className="board-dialog-title">Цели команды «{team.name}»</h2>
        <p className="board-dialog-note">
          Пустое поле — цель набора: {board.firstYearTarget} для 1 курса и {board.secondYearTarget} для 2 курса.
        </p>
        <div className="board-targets">
          <label className="board-target">
            <span>1 курс</span>
            <input
              type="text"
              inputMode="numeric"
              value={first}
              onChange={(event) => setFirst(digitsOnly(event.target.value))}
              autoFocus
              placeholder={String(board.firstYearTarget)}
            />
          </label>
          <label className="board-target">
            <span>2 курс</span>
            <input
              type="text"
              inputMode="numeric"
              value={second}
              onChange={(event) => setSecond(digitsOnly(event.target.value))}
              placeholder={String(board.secondYearTarget)}
            />
          </label>
        </div>
        <div className="board-dialog-actions">
          <button type="submit" className="confirm-primary" disabled={busy}>Сохранить</button>
          <button type="button" className="confirm-secondary" onClick={onCancel} disabled={busy}>Отмена</button>
        </div>
      </form>
    </Modal>
  );
};

export default TargetsDialog;
