import { useCallback, useEffect, useRef, useState } from "react";

import ConfirmDialog from "../confirm-dialog/ConfirmDialog";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { disableJoinLink, getJoinLink, issueJoinLink, joinLinkUrl } from "../../api/apiJoinLink";
import { useIdentity } from "../../context/identityContext";
import { useNotifications } from "../../context/notificationContext";
import { selectionClosedReason } from "../../utils/selectionWindow";
import "./style.css";

/**
 * The team lead's join link: create it, pass it on, replace or switch it off. Whoever opens it joins
 * without a separate approval — the lead handing it out is the approval — so replacing it is how a
 * leaked link is shut.
 */
const JoinLinkPanel = ({ teamId, teamName }) => {
  const { isSelectionOpen, activeTrack } = useIdentity();
  const { notify } = useNotifications();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  // Not knowing the link is not the same as having none: «Создать» would replace a link already
  // handed out, without the warning «Новая ссылка» gives.
  const [loadFailed, setLoadFailed] = useState(false);
  const fieldRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setToken(await getJoinLink(teamId));
      setLoadFailed(false);
    } catch (error) {
      console.error("Не удалось загрузить ссылку для вступления:", error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const { ask, confirmProps } = useConfirmAction(load);

  // Issuing is window-gated on the backend; switching a link off never is.
  const closedReason = isSelectionOpen ? null : selectionClosedReason(activeTrack);
  const url = token ? joinLinkUrl(token) : "";

  const create = async () => {
    setCreating(true);
    try {
      setToken(await issueJoinLink(teamId));
      notify({ type: "success", text: "Ссылка создана" });
    } catch (error) {
      console.error("Не удалось создать ссылку:", error);
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify({ type: "success", text: "Ссылка скопирована" });
    } catch {
      // No clipboard (an older browser, or plain http): hand over the text to copy by hand.
      fieldRef.current?.select();
      notify({ type: "info", text: "Скопируйте выделенную ссылку" });
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: `Команда «${teamName}»`, text: "Вступай в нашу команду", url });
    } catch (error) {
      // Closing the share sheet is not an error worth showing.
      if (error?.name !== "AbortError") {
        console.error("Не удалось поделиться ссылкой:", error);
      }
    }
  };

  const regenerate = () => ask({
    heading: "Выпустить новую ссылку?",
    description: "Старая ссылка перестанет работать: по ней больше никто не вступит.",
    confirmText: "Выпустить новую",
    successText: "Новая ссылка создана",
    run: () => issueJoinLink(teamId),
  });

  const disable = () => ask({
    heading: "Отключить ссылку?",
    description: "По ней больше никто не вступит. Новую ссылку можно выпустить в любой момент, пока идёт набор.",
    confirmText: "Отключить",
    successText: "Ссылка отключена",
    run: () => disableJoinLink(teamId),
  });

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <section className="join-link-panel" aria-labelledby="join-link-title">
      <div className="join-link-head">
        <p className="join-link-kicker">Приглашение</p>
        <h2 id="join-link-title">Ссылка для вступления</h2>
      </div>
      <p className="join-link-note">
        Кто откроет ссылку, вступит в команду сразу, без заявки — если для его курса есть место.
      </p>

      {loading ? (
        <p className="join-link-note">Загрузка…</p>
      ) : loadFailed ? (
        <div className="join-link-actions">
          <p className="join-link-note" role="alert">Не удалось загрузить ссылку.</p>
          <button
            type="button"
            className="join-link-button"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Повторить
          </button>
        </div>
      ) : token ? (
        <>
          <input
            ref={fieldRef}
            className="join-link-url"
            type="text"
            value={url}
            readOnly
            aria-label="Ссылка для вступления"
            onFocus={(event) => event.target.select()}
          />
          <div className="join-link-actions">
            <button type="button" className="join-link-button join-link-button--primary" onClick={copy}>
              Скопировать
            </button>
            {canShare && (
              <button type="button" className="join-link-button" onClick={share}>
                Поделиться
              </button>
            )}
            <button
              type="button"
              className="join-link-button"
              onClick={regenerate}
              disabled={!isSelectionOpen}
              title={closedReason ?? undefined}
            >
              Новая ссылка
            </button>
            <button type="button" className="join-link-button join-link-button--danger" onClick={disable}>
              Отключить
            </button>
          </div>
        </>
      ) : (
        <div className="join-link-actions">
          <button
            type="button"
            className="join-link-button join-link-button--primary"
            onClick={create}
            disabled={!isSelectionOpen || creating}
            title={closedReason ?? undefined}
          >
            Создать ссылку
          </button>
        </div>
      )}
      {closedReason && !loading && <p className="join-link-note">{closedReason}</p>}

      <ConfirmDialog {...confirmProps} />
    </section>
  );
};

export default JoinLinkPanel;
