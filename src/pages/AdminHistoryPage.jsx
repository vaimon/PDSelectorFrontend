import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Pagination from "../components/pagination/Pagination";
import { fetchActivity } from "../api/apiAdmin";
import useAdminList from "../hooks/useAdminList";
import { actionLabel, actorOf, formatAt, periodParams } from "../utils/activity";

const PAGE_SIZE = 50;
const NO_PERIOD = { from: "", to: "" };

/** What the list is narrowed to, from the address a «История» button on another screen opened. */
const subjectOf = (params) => {
  const name = params.get("name") ?? "";
  if (params.get("student")) return { studentId: params.get("student"), title: `История участника «${name}»` };
  if (params.get("team")) return { teamId: params.get("team"), title: `История команды «${name}»` };
  if (params.get("actor")) return { actorUserId: params.get("actor"), title: `Действия: ${name}` };
  return null;
};

/**
 * What was done in the selection and by whom (#49), newest first.
 *
 * Narrowed to one student, team or person by opening it from their row elsewhere in the area —
 * the log itself only knows ids, and the names live inside each entry's sentence. Here only the
 * period is chosen. Every entry renders from what was copied into it when it was written, so it
 * reads the same after the team was renamed or the student deleted.
 */
const AdminHistoryPage = () => {
  const [params, setParams] = useSearchParams();
  const subject = subjectOf(params);
  const [draft, setDraft] = useState(NO_PERIOD);
  const [period, setPeriod] = useState(NO_PERIOD);
  const [page, setPage] = useState(0);

  // A new subject starts from its newest entries, not from the page the previous one was on.
  const subjectKey = params.toString();
  useEffect(() => {
    setPage(0);
  }, [subjectKey]);

  const entries = useAdminList(fetchActivity, {
    teamId: subject?.teamId ?? null,
    studentId: subject?.studentId ?? null,
    actorUserId: subject?.actorUserId ?? null,
    ...periodParams(period),
    page,
    size: PAGE_SIZE,
  });

  const showPeriod = (event) => {
    event.preventDefault();
    setPeriod(draft);
    setPage(0);
  };

  const changeDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  return (
    <section className="admin-section" aria-labelledby="admin-history-title">
      <div className="admin-section-head">
        <p className="admin-section-kicker">История</p>
        <h2 id="admin-history-title">Кто что менял</h2>
      </div>

      <div className="admin-toolbar">
        <form className="admin-search" role="search" aria-label="Период" onSubmit={showPeriod}>
          {/* Each label wraps with its own field: a narrow screen must not leave «по» at the end of
              one line and its date at the start of the next. */}
          <span className="admin-field-pair">
            <label htmlFor="history-from">С</label>
            <input id="history-from" type="date" name="from" className="admin-date" value={draft.from} onChange={changeDraft} />
          </span>
          <span className="admin-field-pair">
            <label htmlFor="history-to">по</label>
            <input id="history-to" type="date" name="to" className="admin-date" value={draft.to} onChange={changeDraft} />
          </span>
          <button type="submit">Показать</button>
        </form>
      </div>

      {subject ? (
        <p className="admin-filter">
          <span>{subject.title}</span>
          <button type="button" className="admin-quiet" onClick={() => setParams({})}>Вся история</button>
        </p>
      ) : (
        <p className="admin-row-reason">
          Историю участника или команды открывают из их строки в «Участниках и командах», а в
          «Доступе» у человека — то, что делал он сам.
        </p>
      )}

      {entries.loading && entries.items.length === 0 ? (
        <p className="admin-state">Загружаем…</p>
      ) : entries.error ? (
        <p className="admin-state admin-state--error">Не удалось загрузить историю. Обновите страницу.</p>
      ) : entries.items.length === 0 ? (
        <p className="admin-state">Записей нет.</p>
      ) : (
        <ul className="admin-rows">
          {entries.items.map((entry) => (
            <li key={entry.id} className="admin-row admin-entry">
              <p className="admin-entry-summary">{entry.summary}</p>
              <p className="admin-row-meta">
                <span className="admin-entry-kind">{actionLabel(entry.action)}</span>
                {" · "}
                {actorOf(entry)}
                {" · "}
                <time dateTime={entry.at}>{formatAt(entry.at)}</time>
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={entries.page} totalPages={entries.totalPages} onPageChange={setPage} />
    </section>
  );
};

export default AdminHistoryPage;
