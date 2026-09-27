import { useState } from "react";

import Modal from "../forms/modal/Modal";
import { courseLabel, isFirstYear } from "../../utils/board";
import "./style.css";

const needLabel = (count) => (count === 1 ? "нужен 1" : `нужно ${count}`);

const byName = (a, b) => a.name.localeCompare(b.name, "ru");

/**
 * «Добавить из пула» (#72): «Переместить в…» the other way round — it starts from a short team and
 * lists the people without one who fill what it lacks, grouped by the year. A year the team has
 * already filled is not offered; «Переместить в…» from the pool still reaches it, over target.
 *
 * Choosing someone does not move them yet: the page asks what it has to ask first, as for any move.
 */
const PoolPicker = ({ board, team, onPick, onCancel }) => {
  const [text, setText] = useState("");
  const needle = text.trim().toLocaleLowerCase("ru");

  const years = [
    { key: "first", label: "1 курс", need: Math.max(0, team.firstYearTarget - team.firstYears), first: true },
    { key: "second", label: "2+ курс", need: Math.max(0, team.secondYearTarget - team.secondYears), first: false },
  ]
    .filter((year) => year.need > 0)
    .map((year) => ({
      ...year,
      students: board.pool
        .filter((student) => isFirstYear(student.course) === year.first)
        .filter((student) => !needle || student.name.toLocaleLowerCase("ru").includes(needle))
        .sort(byName),
    }));

  return (
    <Modal show onClose={onCancel}>
      <div className="board-dialog">
        <h2 className="board-dialog-title">Добавить в «{team.name}»</h2>
        <p className="board-dialog-note">
          Люди без команды, которые закрывают то, чего команде не хватает. В команде неотвеченные
          заявки и приглашения студента закроются.
        </p>

        <input
          type="text"
          className="board-dialog-search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Найти человека"
          placeholder="Имя"
          autoFocus
        />

        {/* Filled while the picker was open — by a drag here, or by another organiser. */}
        {years.length === 0 && <p className="board-dialog-note">Команда уже собрана.</p>}

        {years.map((year) => (
          <section key={year.key} role="group" aria-labelledby={`pool-pick-${year.key}`} className="board-pick-year">
            <h3 id={`pool-pick-${year.key}`} className="board-pick-year-title">
              {year.label} · {needLabel(year.need)}
            </h3>
            {year.students.length === 0 ? (
              <p className="board-dialog-note">
                {needle ? "Никого с таким именем." : `В пуле нет никого с ${year.first ? "1" : "2"} курса.`}
              </p>
            ) : (
              <ul className="board-destinations">
                {year.students.map((student) => (
                  <li key={student.id}>
                    <button type="button" className="board-destination" onClick={() => onPick(student)}>
                      <span className="board-destination-name">{student.name}</span>
                      <span className="board-destination-meta">
                        {courseLabel(student.course)}{student.group ? `, группа ${student.group}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </Modal>
  );
};

export default PoolPicker;
