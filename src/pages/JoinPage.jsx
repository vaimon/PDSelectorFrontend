import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AuthShell from "../components/login-form/AuthShell";
import { joinByToken, previewJoin } from "../api/apiJoinLink";
import { useIdentity } from "../context/identityContext";
import { useApplications } from "../context/applicationsContext";
import { useNotifications } from "../context/notificationContext";
import { forgetJoin, rememberJoin } from "../utils/pendingJoin";
import "../components/login-form/style.css";
import "./JoinPage.css";

// Both mean "no questionnaire for this selection yet": a newcomer, or someone from last year who has
// not confirmed theirs. Filling it in for the current selection fixes either.
const NEEDS_QUESTIONNAIRE = new Set(["NOT_A_PARTICIPANT", "ANOTHER_SELECTION"]);

const Places = ({ label, taken, target }) => (
  <div className="join-places-row">
    <span>{label}</span>
    <strong>{taken} из {target}</strong>
  </div>
);

const Refusal = ({ reason, teamId }) => {
  switch (reason) {
    case "WINDOW_CLOSED":
      return <p className="join-reason">Набор сейчас закрыт — вступить в команду нельзя.</p>;
    case "ALREADY_IN_THIS_TEAM":
      return (
        <p className="join-reason">
          Вы уже в этой команде. <Link to={`/teams/${teamId}`}>Открыть страницу команды</Link>
        </p>
      );
    case "ALREADY_IN_A_TEAM":
      return (
        <p className="join-reason">
          Вы уже состоите в другой команде. Чтобы перейти в эту, сначала выйдите из своей.{" "}
          <Link to="/profile">Моя команда</Link>
        </p>
      );
    case "ANOTHER_SELECTION":
      return (
        <p className="join-reason">
          Эта команда из другого набора — вступить в неё нельзя.{" "}
          <Link to="/teams">Команды текущего набора</Link>
        </p>
      );
    case "NO_PLACES_FOR_THE_YEAR":
      return (
        <p className="join-reason">
          Мест для вашего курса в команде не осталось.{" "}
          <Link to="/teams">Найти другую команду</Link>
        </p>
      );
    default:
      return <p className="join-reason">Вступить в эту команду сейчас нельзя.</p>;
  }
};

const JoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    isParticipant,
    loading: identityLoading,
    error: identityError,
    refresh: refreshIdentity,
  } = useIdentity();
  const { refresh: refreshApplications } = useApplications();
  const { notify } = useNotifications();

  const [preview, setPreview] = useState(null);
  const [invalid, setInvalid] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    try {
      setPreview(await previewJoin(token));
      // The person is signed in and on the invitation: nothing left to bring them back to.
      forgetJoin();
    } catch (error) {
      if (error.response?.status === 404) {
        setInvalid(true);
        forgetJoin();
      } else if (error.response?.status !== 401) {
        // 401 is signed out: the shared client already remembered this page and went to login.
        console.error("Не удалось открыть приглашение:", error);
        setLoadError("Не удалось загрузить приглашение. Обновите страницу.");
      }
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const goToQuestionnaire = () => {
    rememberJoin(`/join/${token}`);
    navigate("/registration");
  };

  const join = async () => {
    setJoining(true);
    try {
      const team = await joinByToken(token);
      // Joining cancels the person's other pending applications and makes them a member, so both
      // the shell and the applications counter are stale now.
      await Promise.all([refreshIdentity(), refreshApplications()]);
      notify({ type: "success", text: `Вы в команде «${team.name ?? preview.teamName}»` });
      navigate(`/teams/${team.id ?? preview.teamId}`);
    } catch (error) {
      // The shared client showed the backend's reason; the preview may have changed since.
      console.error("Не удалось вступить в команду:", error);
      load();
    } finally {
      setJoining(false);
    }
  };

  if (invalid) {
    return (
      <AuthShell title="Ссылка больше не действует">
        <p className="login-purpose">
          Тимлид отключил эту ссылку или выпустил новую. Попросите у него актуальную.
        </p>
      </AuthShell>
    );
  }

  // A 401 is handled by the redirect to login; anything else would leave the page loading forever.
  const identityFailed = identityError && identityError.response?.status !== 401;
  if (loadError || identityFailed) {
    return (
      <AuthShell title="Приглашение в команду">
        <p className="login-purpose" role="alert">
          {loadError ?? "Не удалось загрузить приглашение. Обновите страницу."}
        </p>
      </AuthShell>
    );
  }

  if (identityLoading || !user || !preview) {
    return (
      <AuthShell title="Приглашение в команду">
        <p className="login-purpose">Открываем приглашение…</p>
      </AuthShell>
    );
  }

  const renderAction = () => {
    if (isAdmin) {
      return (
        <p className="join-reason">
          Администратор не вступает в команды. <Link to={`/teams/${preview.teamId}`}>Страница команды</Link>
        </p>
      );
    }
    if (preview.canJoin) {
      return (
        <button type="button" className="login-button join-primary" onClick={join} disabled={joining}>
          {joining ? "Вступаем…" : "Вступить"}
        </button>
      );
    }
    // A participant who still gets ANOTHER_SELECTION was invited into a team of a different
    // selection; the questionnaire would bring them straight back here, so it is a plain refusal.
    if (NEEDS_QUESTIONNAIRE.has(preview.refusalReason) && !isParticipant) {
      return (
        <>
          <p className="join-reason">
            Чтобы вступить, заполните анкету участника набора — после неё вернём вас сюда.
          </p>
          <button type="button" className="login-button join-primary" onClick={goToQuestionnaire}>
            Заполнить анкету и вступить
          </button>
        </>
      );
    }
    return <Refusal reason={preview.refusalReason} teamId={preview.teamId} />;
  };

  return (
    <AuthShell title="Приглашение в команду">
      <section className="join-team" aria-labelledby="join-team-name">
        <h3 id="join-team-name" className="join-team-name">{preview.teamName}</h3>
        {preview.captainName && (
          <p className="join-team-lead">Тимлид: {preview.captainName}</p>
        )}
        <div className="join-places" role="group" aria-label="Места в команде">
          <Places label="1 курс" taken={preview.firstYears} target={preview.firstYearTarget} />
          <Places label="2 курс и старше" taken={preview.secondYears} target={preview.secondYearTarget} />
        </div>
      </section>
      <div className="join-action">{renderAction()}</div>
    </AuthShell>
  );
};

export default JoinPage;
