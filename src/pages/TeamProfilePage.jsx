import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Navbar from "../components/navbar/Navbar";
import Card from "../components/card/Card";
import MainContent from "../components/main-section/MainSection";
import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import useTeamData from "../hooks/useTeamData";
import { useTeamRequests } from "../hooks/useTeamRequests";
import { useTeamManagement } from "../hooks/useTeamManagement";
import { useApplications } from "../context/applicationsContext";
import { useIdentity } from "../context/identityContext";
import { useNotifications } from "../context/notificationContext";
import { isPendingApplication } from "../utils/applicationStatus";
import { describeMissing, describePlaces } from "../utils/composition";
import { describeSelectionWindow, selectionClosedReason } from "../utils/selectionWindow";
import TeamEditForm from "../components/profile/TeamEditForm";
import JoinLinkPanel from "../components/join-link/JoinLinkPanel";
import { useTechnologies } from "../hooks/useTechnologies";
import { useProjectTypes } from "../hooks/useProjectTypes";
import { updateTeam } from "../api/apiTeamsController";
import "./TeamProfilePage.css";

/**
 * What the team's own people are told about its composition: done, or who is still missing and by
 * when. The lead also gets the way to fix it — nobody else can act on it.
 */
const teamStatus = (composition, selection, isCaptain) => {
  const missing = describeMissing(composition);
  if (!missing) {
    return { tone: "complete", text: "Команда собрана: цели по обоим курсам выполнены." };
  }

  if (selection?.state === "closed") {
    return { tone: "missing", text: `${missing}. Неполные команды после набора разбирают организаторы.` };
  }

  // Before the window opens there is nothing to add: no deadline to name yet, and no way to act.
  if (selection?.state !== "open") {
    return { tone: "missing", text: `${missing}.` };
  }

  const invite = isCaptain
    ? " Пригласите участников ссылкой для вступления или со страницы «Участники»."
    : "";
  return { tone: "missing", text: `${missing}. Собрать состав можно ${selection.note}.${invite}` };
};

const TeamProfilePage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const { allTypes } = useProjectTypes();
  const {
    teamData,
    isCaptain,
    loading,
    error,
    refresh,
  } = useTeamData(teamId);

  const { allTechnologies } = useTechnologies();
  const { notify } = useNotifications();
  const { activeTrack, isSelectionOpen, studentId } = useIdentity();
  const { applyActionFor, confirmProps: applyConfirmProps } = useTeamRequests();
  const { requests, sentInvites, refresh: refreshApplications } = useApplications();
  const {
    memberActionsFor,
    selfAction,
    confirmProps: manageConfirmProps,
  } = useTeamManagement({ team: teamData, isCaptain, refresh });

  const applyAction = applyActionFor(teamData?.id ? teamData : null);
  // Requests to this team are answered in one place, «Заявки», where the navbar counter points.
  const pendingForThisTeam = isCaptain ? requests.length : 0;
  const pendingInvites = isCaptain ? sentInvites.filter(isPendingApplication).length : 0;
  // Editing is a student mutation too, so the backend refuses it outside the window.
  const editReason = isSelectionOpen ? null : selectionClosedReason(activeTrack);
  // Whether the team is complete is the team's own business: outsiders read the places instead.
  const isMember = teamData.students?.some((member) => member.id === studentId);
  const status = isMember && teamData.composition
    ? teamStatus(teamData.composition, describeSelectionWindow(activeTrack), isCaptain)
    : null;

  // The form resets itself whenever this prop changes, so it has to change only when the team
  // does: every toast on this page — including the one a failed save raises — re-renders it, and
  // a fresh object literal would throw away what the lead has typed.
  const editInitial = useMemo(() => ({
    name: teamData.name,
    project_description: teamData.project_description,
    project_type: teamData.project_type || null,
    technologies: teamData.technologies || [],
  }), [teamData]);

  const handleSave = async (updatedData) => {
    try {
      await updateTeam(updatedData, teamId);
      // The name travels: the cabinet card and the invite dialogs read it from the applications
      // state. Refetch before saying it worked, so the card never shows the old name as new.
      await Promise.all([refresh(), refreshApplications()]);
      setShowEditForm(false);
      notify({ type: "success", text: "Изменения сохранены" });
    } catch (saveError) {
      // The shared client has already said what went wrong; the form stays open with what the
      // lead typed, so they can fix it instead of writing it again.
      console.error("Не удалось сохранить команду:", saveError);
    }
  };

  const renderMembers = () => {
    if (loading) return <p className="team-inline-state">Загрузка…</p>;
    if (error) return <p className="team-inline-state team-inline-state--error">{error}</p>;

    const members = teamData.students ?? [];
    if (members.length === 0) {
      return <p className="empty-state">Нет участников.</p>;
    }

    return (
      <div className="cards">
        {members.map((member) => (
          <Card
            key={member.id}
            variant="person"
            name={member.user?.fio || member.fio}
            resume={member.about_self || "Нет описания"}
            tags={member.technologies || []}
            profileLink={`/students/${member.id}`}
            // The lead is named once, here: naming them beside the roster as well was a second
            // answer to the same question.
            badge={member.id === teamData.captain?.id ? "Тимлид" : undefined}
            actions={memberActionsFor(member)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="page-container team-profile-page">
        <header className="team-profile-toolbar team-profile-toolbar--single">
          <button type="button" className="team-back-button" onClick={() => navigate("/teams")}>
            <FaArrowLeft aria-hidden="true" />
            <span>Назад к командам</span>
          </button>
          <div className="team-profile-heading">
            <p>Команды</p>
            <h1>{teamData.name || "Профиль команды"}</h1>
          </div>
        </header>

        <div className="team-profile-layout team-profile-layout--single">
          <MainContent>
            <section className="team-overview" aria-labelledby="team-overview-title">
              <div className="team-section-head">
                <div>
                  <p className="team-section-kicker">Карточка проекта</p>
                  <h2 id="team-overview-title">О команде</h2>
                </div>
                {isCaptain ? (
                  <div className="team-action">
                    {!showEditForm && editReason && (
                      <span className="team-action-reason">{editReason}</span>
                    )}
                    <button
                      type="button"
                      className="team-edit-toggle"
                      aria-expanded={showEditForm}
                      onClick={() => setShowEditForm((prev) => !prev)}
                      disabled={!showEditForm && !isSelectionOpen}
                      title={editReason}
                    >
                      {showEditForm ? "Закрыть" : "Редактировать"}
                    </button>
                  </div>
                ) : applyAction && (
                  <div className="team-action">
                    {applyAction.disabled && applyAction.reason && (
                      <span className="team-action-reason">{applyAction.reason}</span>
                    )}
                    <button
                      type="button"
                      className="team-edit-toggle team-apply-button"
                      onClick={applyAction.onClick}
                      disabled={applyAction.disabled}
                      title={applyAction.reason}
                    >
                      {applyAction.label}
                    </button>
                  </div>
                )}
              </div>

              {showEditForm && isCaptain ? (
                <TeamEditForm
                  teamData={editInitial}
                  onSave={handleSave}
                  onCancel={() => setShowEditForm(false)}
                  allTechnologies={allTechnologies}
                  projectTypes={allTypes}
                />
              ) : loading ? (
                <p className="team-inline-state">Загрузка данных команды…</p>
              ) : error ? (
                <p className="team-inline-state team-inline-state--error">{error}</p>
              ) : (
                <article className="team-info-card">
                  <div className="team-info-row">
                    <span>Тип проекта</span>
                    <strong>{teamData.project_type?.name || "Не указан"}</strong>
                  </div>
                  <div className="team-info-row team-info-row--description">
                    <span>Описание</span>
                    <p>{teamData.project_description || teamData.description || "Описание пока не добавлено"}</p>
                  </div>
                  <div className="team-info-row team-info-row--technologies">
                    <span>Технологии</span>
                    <div className="card-tags">
                      {teamData.technologies?.length > 0 ? (
                        teamData.technologies.map((technology) => (
                          <span className="card-tag" key={technology.id || technology.name}>
                            {technology.name || technology}
                          </span>
                        ))
                      ) : (
                        <span className="no-tags">Не указаны</span>
                      )}
                    </div>
                  </div>
                </article>
              )}
            </section>

            {/* Above the member list: on a phone the lead would otherwise scroll past every card. */}
            {!loading && !error && isCaptain && teamData.id && (
              <JoinLinkPanel teamId={teamData.id} teamName={teamData.name} />
            )}

            {!loading && !error && (
              <section className="team-members" aria-labelledby="team-members-title">
                <div className="team-section-head">
                  <div>
                    <p className="team-section-kicker">Состав</p>
                    <h2 id="team-members-title">Текущие участники</h2>
                    {teamData.composition && (
                      <p className="team-section-note">{describePlaces(teamData.composition)}</p>
                    )}
                    {status && (
                      <p className={`team-status team-status--${status.tone}`}>{status.text}</p>
                    )}
                    {/* Answering happens on «Заявки», where the navbar counter points. */}
                    {isCaptain && pendingInvites > 0 && (
                      <p className="team-section-note">
                        Приглашений ждёт ответа: {pendingInvites}.{" "}
                        <Link to="/applications">Посмотреть</Link>
                      </p>
                    )}
                  </div>
                  {isCaptain && (
                    <button
                      type="button"
                      className="team-edit-toggle"
                      onClick={() => navigate("/applications")}
                    >
                      Заявки в команду
                      {pendingForThisTeam > 0 && ` (${pendingForThisTeam})`}
                    </button>
                  )}
                </div>
                {renderMembers()}
              </section>
            )}

            {/* Away from the roster on purpose: neither of these belongs one click from
                «Редактировать». */}
            {!loading && !error && selfAction && (
              <section className="team-danger" aria-labelledby="team-danger-title">
                <div className="team-danger-text">
                  <h2 id="team-danger-title">
                    {isCaptain ? "Роспуск команды" : "Выход из команды"}
                  </h2>
                  <p>
                    {isCaptain
                      ? "Команда исчезнет вместе со своими заявками, а её участники освободятся. Если команда должна остаться без вас — передайте роль тимлида."
                      : "Вы освободите место для своего курса. Вернуться можно будет по заявке или по ссылке-приглашению."}
                  </p>
                  {selfAction.disabled && selfAction.reason && (
                    <p className="team-action-reason">{selfAction.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="team-danger-button"
                  onClick={selfAction.onClick}
                  disabled={selfAction.disabled}
                  title={selfAction.reason}
                >
                  {selfAction.label}
                </button>
              </section>
            )}
          </MainContent>
        </div>
      </main>

      <ConfirmDialog {...applyConfirmProps} />
      <ConfirmDialog {...manageConfirmProps} />
    </>
  );
};

export default TeamProfilePage;
