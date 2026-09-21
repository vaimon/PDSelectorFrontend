import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import Pagination from "../components/pagination/Pagination";
import { assignRole, fetchUsers } from "../api/apiAdmin";
import { redirectToLogin } from "../api/authRedirect";
import { useIdentity } from "../context/identityContext";
import useAdminList from "../hooks/useAdminList";
import useConfirmAction from "../hooks/useConfirmAction";

const PAGE_SIZE = 20;
// The backend's own sentence (UserService.assertNotTheLastAdmin), said before it has to refuse.
const LAST_ADMIN_REASON = "Это последний администратор: сначала назначьте другого, иначе выдать роль будет некому.";
// A role change ends every session of that person (UserService.assignRole → updateUserAuthorities).
const SIGNED_OUT = "Все открытые сеансы этого человека закончатся — войти придётся заново.";

/**
 * Who may open the admin area (#49). Opens on the current admins — the short list that answers
 * «who has access now»; a search by name or e-mail finds anyone enabled, to give access to.
 *
 * There are two roles since vaimon/team-selection#17, STUDENT and ADMIN, so there is nothing to
 * pick: access is given or taken. Not locked by the hand-over — a role is not the selection's data.
 */
const AdminAccessPage = () => {
  const navigate = useNavigate();
  const { user: me } = useIdentity();
  const [query, setQuery] = useState({ text: "", page: 0 });
  const [draft, setDraft] = useState("");

  const people = useAdminList(fetchUsers, query.text
    ? { text: query.text, page: query.page, size: PAGE_SIZE }
    : { role: "ADMIN", page: query.page, size: PAGE_SIZE });
  // Only the count. It is of admins who can sign in, which is stricter than the backend: that one
  // also counts disabled accounts and the demo admin of migration V1.002 (vaimon/team-selection#45),
  // and would let the last usable admin step down. Until the count is known, nobody may step down.
  const admins = useAdminList(fetchUsers, { role: "ADMIN", page: 0, size: 1 });
  const countKnown = !admins.loading && !admins.error;
  const lastAdmin = countKnown && admins.totalElements <= 1;

  const { refresh: refreshPeople } = people;
  const { refresh: refreshAdmins } = admins;
  const reloadAll = useCallback(() => {
    refreshPeople();
    refreshAdmins();
  }, [refreshPeople, refreshAdmins]);
  const { ask, confirmProps } = useConfirmAction(reloadAll);

  const search = (event) => {
    event.preventDefault();
    setQuery({ text: draft.trim(), page: 0 });
  };

  const backToAdmins = () => {
    setDraft("");
    setQuery({ text: "", page: 0 });
  };

  const showHistory = (user) => {
    navigate(`/admin/history?actor=${user.id}&name=${encodeURIComponent(user.fio)}`);
  };

  const askGrant = (user) => {
    const team = user.student?.current_team_name;
    // A participant's data stays as it is; what changes is what they can do as a participant.
    const staying = user.student?.current_track_id
      ? ` Анкета${team ? ` и место в команде «${team}»` : ""} останутся, в составах ${user.fio} будет`
        + " числиться как раньше, но заполнить новую анкету или вступить по ссылке уже не сможет."
      : "";
    ask({
      heading: "Дать доступ к администрированию?",
      description: `${user.fio} сможет открывать «Администрирование» и менять в нём всё, что можете вы.${staying} ${SIGNED_OUT}`,
      confirmText: "Дать доступ",
      successText: "Доступ выдан",
      run: () => assignRole(user.id, "ADMIN"),
    });
  };

  const askRevoke = (user) => {
    const self = user.id === me?.id;
    ask({
      heading: "Снять доступ?",
      description: self
        ? "Вы выйдете из системы на всех устройствах и больше не сможете открывать «Администрирование»:"
          + " вернуть доступ сможет только другой администратор."
        : `${user.fio} больше не сможет открывать «Администрирование». ${SIGNED_OUT}`,
      confirmText: "Снять доступ",
      successText: "Доступ снят",
      run: () => assignRole(user.id, "STUDENT"),
      // The backend has already ended this session: go where it would send a signed-out person.
      after: self ? async () => redirectToLogin() : undefined,
    });
  };

  const renderUser = (user) => {
    const isAdmin = user.role === "ADMIN";
    const isMe = user.id === me?.id;
    return (
      <li key={user.id} className="admin-row">
        <div className="admin-row-head">
          <div className="admin-row-main">
            <h3>{user.fio}</h3>
            <p className="admin-row-meta">
              {user.email} · {isAdmin ? "администратор" : "без доступа"}{isMe ? " · это вы" : ""}
            </p>
          </div>
          <div className="admin-row-actions">
            <button type="button" onClick={() => showHistory(user)}>История</button>
            {isAdmin ? (
              <button
                type="button"
                className="admin-danger"
                disabled={!countKnown || lastAdmin}
                onClick={() => askRevoke(user)}
              >
                Снять доступ
              </button>
            ) : (
              <button type="button" onClick={() => askGrant(user)}>Дать доступ</button>
            )}
          </div>
        </div>
        {isAdmin && lastAdmin && <p className="admin-row-reason">{LAST_ADMIN_REASON}</p>}
      </li>
    );
  };

  return (
    <>
      <section className="admin-section" aria-labelledby="admin-access-title">
        <div className="admin-section-head">
          <p className="admin-section-kicker">Доступ</p>
          <h2 id="admin-access-title">
            {query.text ? "Найти человека" : "Кто может открывать этот раздел"}
          </h2>
        </div>

        <div className="admin-toolbar">
          <form className="admin-search" role="search" onSubmit={search}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="Поиск людей"
              placeholder="ФИО или почта"
            />
            <button type="submit">Найти</button>
          </form>
        </div>

        {query.text && (
          <p className="admin-filter">
            <span>Найдено по «{query.text}»</span>
            <button type="button" className="admin-quiet" onClick={backToAdmins}>Администраторы</button>
          </p>
        )}

        {people.loading && people.items.length === 0 ? (
          <p className="admin-state">Загружаем…</p>
        ) : people.error ? (
          <p className="admin-state admin-state--error">Не удалось загрузить список. Обновите страницу.</p>
        ) : people.items.length === 0 ? (
          <p className="admin-state">Никого не нашлось.</p>
        ) : (
          <ul className="admin-rows">{people.items.map(renderUser)}</ul>
        )}

        <Pagination
          page={people.page}
          totalPages={people.totalPages}
          onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        />
      </section>

      <ConfirmDialog {...confirmProps} />
    </>
  );
};

export default AdminAccessPage;
