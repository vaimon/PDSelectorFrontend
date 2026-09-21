import { useCallback, useEffect, useState } from "react";

import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import Pagination from "../components/pagination/Pagination";
import TeamEditForm from "../components/profile/TeamEditForm";
import { deleteStudent, fetchStudents, updateStudent } from "../api/apiStudentsController";
import { deleteTeam, fetchTeams, updateTeam } from "../api/apiTeamsController";
import { useIdentity } from "../context/identityContext";
import { useNotifications } from "../context/notificationContext";
import useAdminList from "../hooks/useAdminList";
import useConfirmAction from "../hooks/useConfirmAction";
import useHandOver from "../hooks/useHandOver";
import { useProjectTypes } from "../hooks/useProjectTypes";
import { useTechnologies } from "../hooks/useTechnologies";
import { describePlaces } from "../utils/composition";
import { toStudentFormValues, toStudentPayload, validateStudent } from "../utils/studentForm";
import "./AdminPeoplePage.css";

const PAGE_SIZE = 20;
const LEAD_REASON = "Тимлида удалить нельзя: сначала передайте роль тимлида или распустите команду.";
const NO_SELECTION = { items: [], page: 0, totalPages: 0, totalElements: 0 };
const EMPTY_DRAFT = { input: "", course: "", group: "" };
const EMPTY_STUDENT_QUERY = { ...EMPTY_DRAFT, page: 0, team: null };
const digitsOnly = (value) => value.replace(/[^0-9]/g, "");

const StudentEditor = ({ student, onSaved, onCancel }) => {
  const [values, setValues] = useState(() => toStudentFormValues(student));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const change = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    const found = validateStudent(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const saved = await updateStudent(toStudentPayload(student, values), student.id);
      await onSaved(saved);
    } catch (error) {
      // The shared client has already said what went wrong; what was typed stays.
      console.error("Не удалось сохранить участника:", error);
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, error, props = {}) => (
    <div className="admin-row-field">
      <label htmlFor={`${name}-${student.id}`}>{label}</label>
      <input
        id={`${name}-${student.id}`}
        name={name}
        value={values[name]}
        onChange={change}
        className={errors[name] ? "input-error" : ""}
        aria-invalid={errors[name] || undefined}
        aria-describedby={errors[name] ? `${name}-${student.id}-error` : undefined}
        {...props}
      />
      {errors[name] && <p className="error-text" id={`${name}-${student.id}-error`}>{error}</p>}
    </div>
  );

  return (
    <form className="admin-row-form" onSubmit={save}>
      {field("fio", "ФИО", "Укажите ФИО", { type: "text" })}
      {field("email", "Почта", "Нужен адрес почты", { type: "email" })}
      {field("course", "Курс", "Курс — число от 1 до 10", { type: "text", inputMode: "numeric" })}
      {field("groupNumber", "Группа", "Группа — число от 0 до 20", { type: "text", inputMode: "numeric" })}
      <div className="admin-row-form-actions">
        <button type="submit" disabled={saving}>Сохранить</button>
        <button type="button" className="admin-quiet" onClick={onCancel} disabled={saving}>Отмена</button>
      </div>
    </form>
  );
};

/**
 * Fixes an organiser makes by hand (#48): a student's course, group, name and e-mail, a stray
 * registration, a team's name and details, a team that should not exist.
 *
 * One section with a toggle, because the issue asks for «one place». A student is found by name,
 * by course and group together — group numbers repeat across years — or «by team», from that
 * team's own row rather than from a list of every team to pick from.
 */
const AdminPeoplePage = () => {
  const { activeTrack } = useIdentity();
  const { handedOver } = useHandOver();
  const { notify } = useNotifications();
  const { allTechnologies } = useTechnologies();
  const { allTypes } = useProjectTypes();

  const [view, setView] = useState("students");
  const [studentQuery, setStudentQuery] = useState(EMPTY_STUDENT_QUERY);
  const [teamQuery, setTeamQuery] = useState({ input: "", page: 0 });
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  // What is being edited, and for a team a snapshot of it taken when the editor opened: the
  // editor resets whenever its data changes, and a list reload must not wipe what was typed.
  const [editing, setEditing] = useState(null);
  // A save's warning stays with its row after the list reloads under it: the list does not carry it.
  const [warnings, setWarnings] = useState({});

  // Between two selections the search has nothing to answer about; the lists are not asked.
  const fetchStudentPage = useCallback(
    (params) => (activeTrack ? fetchStudents(params) : Promise.resolve(NO_SELECTION)),
    [activeTrack],
  );
  const fetchTeamPage = useCallback(
    (params) => (activeTrack ? fetchTeams(params) : Promise.resolve(NO_SELECTION)),
    [activeTrack],
  );

  const students = useAdminList(fetchStudentPage, {
    input: studentQuery.input,
    course: studentQuery.course ? [Number(studentQuery.course)] : undefined,
    groupNumber: studentQuery.group ? [Number(studentQuery.group)] : undefined,
    teamId: studentQuery.team?.id ?? null,
    page: studentQuery.page,
    size: PAGE_SIZE,
  });
  const teams = useAdminList(fetchTeamPage, { input: teamQuery.input, page: teamQuery.page, size: PAGE_SIZE });

  // Both lists, always: a team's name shows on its members' rows, and a student's course shows
  // in their team's composition — a change on one side is stale on the other until both reload.
  const { refresh: refreshStudents } = students;
  const { refresh: refreshTeams } = teams;
  const reloadAll = useCallback(async () => {
    refreshStudents();
    refreshTeams();
  }, [refreshStudents, refreshTeams]);
  const { ask, confirmProps } = useConfirmAction(reloadAll);

  // A delete can empty the last page; land on the last one that still has rows.
  useEffect(() => {
    const last = Math.max(students.totalPages - 1, 0);
    if (!students.loading && studentQuery.page > last) {
      setStudentQuery((current) => ({ ...current, page: last }));
    }
  }, [students.loading, students.totalPages, studentQuery.page]);
  useEffect(() => {
    const last = Math.max(teams.totalPages - 1, 0);
    if (!teams.loading && teamQuery.page > last) {
      setTeamQuery((current) => ({ ...current, page: last }));
    }
  }, [teams.loading, teams.totalPages, teamQuery.page]);

  const locked = handedOver;

  const switchTo = (next) => {
    setView(next);
    setEditing(null);
    setDraft(next === "students"
      ? { input: studentQuery.input, course: studentQuery.course, group: studentQuery.group }
      : { ...EMPTY_DRAFT, input: teamQuery.input });
  };

  const changeDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: name === "input" ? value : digitsOnly(value) }));
  };

  const search = (event) => {
    event.preventDefault();
    setEditing(null);
    if (view === "students") {
      setStudentQuery((current) => ({
        ...current,
        input: draft.input.trim(),
        course: draft.course,
        group: draft.group,
        page: 0,
      }));
    } else {
      setTeamQuery({ input: draft.input.trim(), page: 0 });
    }
  };

  const showAllStudents = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setStudentQuery(EMPTY_STUDENT_QUERY);
  };

  const showMembers = (team) => {
    setView("students");
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setStudentQuery({ ...EMPTY_STUDENT_QUERY, team: { id: team.id, name: team.name } });
  };

  const editTeam = (team) => setEditing({
    kind: "team",
    id: team.id,
    initial: {
      name: team.name,
      project_description: team.project_description,
      project_type: team.project_type || null,
      technologies: team.technologies || [],
    },
  });

  const studentSaved = async (saved) => {
    setWarnings((current) => ({ ...current, [saved.id]: saved.compositionWarning ?? null }));
    setEditing(null);
    reloadAll();
    notify({ type: "success", text: "Сохранено" });
  };

  const teamSaved = async (updated) => {
    const teamId = editing.id;
    try {
      await updateTeam(updated, teamId);
      setEditing(null);
      reloadAll();
      notify({ type: "success", text: "Сохранено" });
    } catch (error) {
      console.error("Не удалось сохранить команду:", error);
    }
  };

  const askDeleteStudent = (student) => ask({
    heading: "Удалить анкету?",
    description: `Анкета ${student.user?.fio} будет удалена вместе с заявками и приглашениями`
      + `${student.current_team ? `, участник выйдет из команды «${student.current_team.name}»` : ""},`
      + " а из истории пропадут команды, где он состоял. Учётная запись останется: человек сможет"
      + " войти и заполнить анкету заново.",
    confirmText: "Удалить",
    successText: "Анкета удалена",
    run: async () => {
      await deleteStudent(student.id);
      setEditing(null);
    },
  });

  const askDeleteTeam = (team) => ask({
    heading: "Удалить команду?",
    description: `Команда «${team.name}» будет удалена. Её участники станут свободными, заявки в неё`
      + " и приглашения от неё удалятся, из истории участников она пропадёт, а ссылка для"
      + " вступления перестанет работать.",
    confirmText: "Удалить",
    successText: "Команда удалена",
    run: async () => {
      await deleteTeam(team.id);
      setEditing(null);
      // A filter by a team that no longer exists would show an empty list under its name.
      setStudentQuery((current) => (current.team?.id === team.id ? EMPTY_STUDENT_QUERY : current));
    },
  });

  const renderStudent = (student) => {
    const isEditing = editing?.kind === "student" && editing.id === student.id;
    // The hand-over is said once above the list; a row only explains what is its own.
    const reason = !locked && student.is_captain ? LEAD_REASON : null;
    const team = student.current_team;
    return (
      <li key={student.id} className="admin-row">
        <div className="admin-row-head">
          <div className="admin-row-main">
            <h3>{student.user?.fio}</h3>
            <p className="admin-row-meta">
              {student.course} курс · группа {student.group_number} ·{" "}
              {team ? `команда «${team.name}»${student.is_captain ? ", тимлид" : ""}` : "без команды"}
            </p>
          </div>
          <div className="admin-row-actions">
            <button type="button" disabled={locked || isEditing} onClick={() => setEditing({ kind: "student", id: student.id })}>
              Изменить
            </button>
            <button
              type="button"
              className="admin-danger"
              disabled={locked || student.is_captain}
              onClick={() => askDeleteStudent(student)}
            >
              Удалить
            </button>
          </div>
        </div>
        {reason && <p className="admin-row-reason">{reason}</p>}
        {/* Always mounted, so that a warning arriving after a save is announced, not just drawn. */}
        <p className="admin-row-warning" aria-live="polite">{warnings[student.id] ?? ""}</p>
        {isEditing && (
          <StudentEditor student={student} onSaved={studentSaved} onCancel={() => setEditing(null)} />
        )}
      </li>
    );
  };

  const renderTeam = (team) => {
    const isEditing = editing?.kind === "team" && editing.id === team.id;
    return (
      <li key={team.id} className="admin-row">
        <div className="admin-row-head">
          <div className="admin-row-main">
            <h3>{team.name}</h3>
            <p className="admin-row-meta">
              {team.composition ? describePlaces(team.composition) : `${team.quantity_of_students} чел.`}
              {team.captain?.user?.fio ? ` · тимлид ${team.captain.user.fio}` : ""}
            </p>
          </div>
          <div className="admin-row-actions">
            <button type="button" onClick={() => showMembers(team)}>Участники</button>
            <button type="button" disabled={locked || isEditing} onClick={() => editTeam(team)}>
              Изменить
            </button>
            <button type="button" className="admin-danger" disabled={locked} onClick={() => askDeleteTeam(team)}>
              Удалить
            </button>
          </div>
        </div>
        {isEditing && (
          <div className="admin-row-team-form">
            <TeamEditForm
              teamData={editing.initial}
              onSave={teamSaved}
              onCancel={() => setEditing(null)}
              allTechnologies={allTechnologies}
              projectTypes={allTypes}
            />
          </div>
        )}
      </li>
    );
  };

  const list = view === "students" ? students : teams;
  const setPage = (page) => {
    setEditing(null);
    if (view === "students") {
      setStudentQuery((current) => ({ ...current, page }));
    } else {
      setTeamQuery((current) => ({ ...current, page }));
    }
  };

  return (
    <>
      <section className="admin-section" aria-labelledby="admin-people-title">
        <div className="admin-section-head">
          <p className="admin-section-kicker">Участники и команды</p>
          <h2 id="admin-people-title">Исправить вручную</h2>
        </div>

        {!activeTrack ? (
          <p className="admin-state">
            Сейчас нет активного набора — исправлять пока нечего.
          </p>
        ) : (
          <>
            <div className="people-toolbar">
              <div className="people-toggle" role="group" aria-label="Что показать">
                <button type="button" aria-pressed={view === "students"} onClick={() => switchTo("students")}>
                  Участники
                </button>
                <button type="button" aria-pressed={view === "teams"} onClick={() => switchTo("teams")}>
                  Команды
                </button>
              </div>
              <form className="people-search" role="search" onSubmit={search}>
                <input
                  type="text"
                  name="input"
                  value={draft.input}
                  onChange={changeDraft}
                  aria-label={view === "students" ? "Поиск участников" : "Поиск команд"}
                  placeholder={view === "students" ? "ФИО или о себе" : "Название или описание"}
                />
                {view === "students" && (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="course"
                      className="people-number"
                      value={draft.course}
                      onChange={changeDraft}
                      aria-label="Искать по курсу"
                      placeholder="курс"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      name="group"
                      className="people-number"
                      value={draft.group}
                      onChange={changeDraft}
                      aria-label="Искать по группе"
                      placeholder="группа"
                    />
                  </>
                )}
                <button type="submit">Найти</button>
              </form>
            </div>

            {view === "students" && studentQuery.team && (
              <p className="admin-filter">
                <span>Участники команды «{studentQuery.team.name}»</span>
                <button type="button" className="admin-quiet" onClick={showAllStudents}>
                  Все участники
                </button>
              </p>
            )}

            {/* Once for the list, not once per row: the banner above already gives the sentence. */}
            {locked && <p className="people-locked">Набор передан — правки в кабинете ПД.</p>}

            {list.loading && list.items.length === 0 ? (
              <p className="admin-state">Загружаем…</p>
            ) : list.error ? (
              <p className="admin-state admin-state--error">Не удалось загрузить список. Обновите страницу.</p>
            ) : list.items.length === 0 ? (
              <p className="admin-state">{view === "students" ? "Никого не нашлось." : "Команд не нашлось."}</p>
            ) : (
              <ul className="admin-rows">
                {view === "students" ? students.items.map(renderStudent) : teams.items.map(renderTeam)}
              </ul>
            )}

            <Pagination page={list.page} totalPages={list.totalPages} onPageChange={setPage} />
          </>
        )}
      </section>

      <ConfirmDialog {...confirmProps} />
    </>
  );
};

export default AdminPeoplePage;
