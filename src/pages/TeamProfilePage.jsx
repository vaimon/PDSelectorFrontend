import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaUserCircle } from "react-icons/fa";
import Navbar from "../components/navbar/Navbar";
import Card from "../components/card/Card";
import MainContent from "../components/main-section/MainSection";
import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import useTeamData from "../hooks/useTeamData";
import { useTeamRequests } from "../hooks/useTeamRequests";
import { useApplications } from "../context/applicationsContext";
import { isPendingApplication } from "../utils/applicationStatus";
import TeamEditForm from "../components/profile/TeamEditForm";
import JoinLinkPanel from "../components/join-link/JoinLinkPanel";
import { useTechnologies } from "../hooks/useTechnologies";
import { useProjectTypes } from "../hooks/useProjectTypes";
import { updateTeam } from "../api/apiTeamsController";
import "./TeamProfilePage.css";

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
  } = useTeamData(teamId);

  const { allTechnologies } = useTechnologies();
  const { applyActionFor, confirmProps } = useTeamRequests();
  const { requests, sentInvites } = useApplications();

  const applyAction = applyActionFor(teamData?.id ? teamData : null);
  // Requests to this team are answered in one place, «Заявки», where the navbar counter points.
  const pendingForThisTeam = isCaptain ? requests.length : 0;
  const pendingInvites = isCaptain ? sentInvites.filter(isPendingApplication).length : 0;

  const handleSave = async (updatedData) => {
    await updateTeam(updatedData, teamId);
    window.location.reload();
  };

  const captainName = teamData.captain?.fio
    || teamData.captain?.user?.fio
    || teamData.captainName
    || "Не указан";

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
            name={member.user?.fio || member.fio}
            resume={member.about_self || "Нет описания"}
            tags={member.technologies || []}
            profileLink={`/students/${member.id}`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="team-profile-page">
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
                  <button
                    type="button"
                    className="team-edit-toggle"
                    aria-expanded={showEditForm}
                    onClick={() => setShowEditForm((prev) => !prev)}
                  >
                    {showEditForm ? "Закрыть" : "Редактировать"}
                  </button>
                ) : applyAction && (
                  <div className="team-apply">
                    {applyAction.disabled && applyAction.reason && (
                      <span className="team-apply-reason">{applyAction.reason}</span>
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
                  teamData={{
                    name: teamData.name,
                    project_description: teamData.project_description,
                    project_type: teamData.project_type || null,
                    technologies: teamData.technologies || [],
                  }}
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
                <div className="team-summary-grid">
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
                  <aside className="team-captain">
                    <FaUserCircle aria-hidden="true" />
                    <div>
                      <span>Капитан команды</span>
                      <strong>{captainName}</strong>
                    </div>
                  </aside>
                </div>
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
                    {/* Answering happens on «Заявки», where the navbar counter points. */}
                    {isCaptain && pendingInvites > 0 && (
                      <p className="team-section-note">
                        Приглашений ждёт ответа: {pendingInvites}.{" "}
                        <Link to="/applications">Посмотреть</Link>
                      </p>
                    )}
                  </div>
                  {isCaptain && (
                    <Link to="/applications" className="team-edit-toggle">
                      Заявки в команду
                      {pendingForThisTeam > 0 && ` (${pendingForThisTeam})`}
                    </Link>
                  )}
                </div>
                {renderMembers()}
              </section>
            )}
          </MainContent>
        </div>
      </main>

      <ConfirmDialog {...confirmProps} />
    </>
  );
};

export default TeamProfilePage;
