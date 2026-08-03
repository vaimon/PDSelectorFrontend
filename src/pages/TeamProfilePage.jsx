import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaInbox, FaUserCircle, FaUsers } from "react-icons/fa";
import Navbar from "../components/navbar/Navbar";
import Sidebar from "../components/sidebar/Sidebar";
import Card from "../components/card/Card";
import MainContent from "../components/main-section/MainSection";
import useCurrentUser from "../hooks/useCurrentUser";
import useTeamData from "../hooks/useTeamData";
import ApplicationCard from "../components/card/ApplicationCard";
import { fetchApplicationById } from "../api/apiApplication";
import { updateApplication } from "../api/apiApplication";
import useSuccessMessage from "../hooks/useSuccessMessage";
import TeamEditForm from "../components/profile/TeamEditForm";
import { useTechnologies } from "../hooks/useTechnologies";
import { useProjectTypes } from "../hooks/useProjectTypes";
import { updateTeam } from "../api/apiTeamsController";
import "./TeamProfilePage.css";
const sidebarItems = [
  { name: "Текущие участники", icon: <FaUsers aria-hidden="true" /> },
  { name: "Заявки в команду", icon: <FaInbox aria-hidden="true" /> },
];

const TeamProfilePage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [currentContent, setCurrentContent] = useState("Текущие участники");
  const [showEditForm, setShowEditForm] = useState(false);
  const { allTypes } = useProjectTypes();
  const currentUser = useCurrentUser();
  const { successMessage, showSuccessMessage } = useSuccessMessage();
  const {
    teamData,
    isCaptain,
    loading,
    error,
  } = useTeamData(teamId, currentUser, currentContent);

  
  const { allTechnologies } = useTechnologies();

  const handleSave = async (updatedData) => {
    await updateTeam(updatedData, teamId);
    window.location.reload();
  };
  const handleApplicationStatusChange = async (applicationId, status) => {
    try {
      const applicationData = await fetchApplicationById(applicationId);
      applicationData.status = status;
      await updateApplication(applicationData);
      showSuccessMessage(`Заявка успешно ${status.toLowerCase()}`);
    } catch (err) {
      console.error(`Ошибка изменения статуса заявки: ${status}`, err);
    }
  };

  const renderMainContent = () => {
    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>{error}</p>;

    const data = currentContent === "Текущие участники" ? teamData.students : teamData.applications;

    return (
      <div className="cards">
        {data.length > 0 ? (
          data.map((item) =>
            currentContent === "Заявки в команду" ? (
              <ApplicationCard
                key={item.id}
                applicationId={item.id}
                studentName={item.student?.fio || item.user?.fio}
                teamName={teamData.name}
                teamId={teamId}
                studentId={item.student?.id || item.user?.id}
                teamDescription={teamData.project_description || teamData.description}
                technologies={item.technologies || []}
                status={item.status || "Sent"}
                showCaptainOptions={true}
                onApprove={() =>
                  handleApplicationStatusChange(item.id, "Accepted")
                }
                onReject={() =>
                  handleApplicationStatusChange(item.id, "Rejected")
                }
                onCancel={() =>
                  handleApplicationStatusChange(item.id, "Cancelled")
                }
                onSending={(id) => console.log("Re-sent:", id)}
              />
            ) : (
              <Card
                key={item.id}
                name={item.student?.fio || item.user?.fio}
                resume={item.about_self || "Нет описания"}
                tags={item.technologies || []}
              />
            )
          )
        ) : (
          <p className="empty-state">
            {currentContent === "Заявки в команду"
              ? "Нет доступных запросов."
              : "Нет участников."}
          </p>
        )}
      </div>
    );
  };

  const captainName = teamData.captain?.fio
    || teamData.captain?.user?.fio
    || teamData.captainName
    || "Не указан";

  return (
    <>
      <Navbar />
      <main className="team-profile-page">
        <header className={`team-profile-toolbar${isCaptain ? "" : " team-profile-toolbar--single"}`}>
          <button type="button" className="team-back-button" onClick={() => navigate("/teams")}>
            <FaArrowLeft aria-hidden="true" />
            <span>Назад к командам</span>
          </button>
          <div className="team-profile-heading">
            <p>Команды</p>
            <h1>{teamData.name || "Профиль команды"}</h1>
          </div>
        </header>

        <div className={`team-profile-layout${isCaptain ? "" : " team-profile-layout--single"}`}>
          {isCaptain && (
            <Sidebar
              onItemClick={setCurrentContent}
              items={sidebarItems}
              activeItem={currentContent}
            />
          )}
          <MainContent>
            {successMessage && <div className="success-message">{successMessage}</div>}

            <section className="team-overview" aria-labelledby="team-overview-title">
              <div className="team-section-head">
                <div>
                  <p className="team-section-kicker">Карточка проекта</p>
                  <h2 id="team-overview-title">О команде</h2>
                </div>
                {isCaptain && (
                  <button
                    type="button"
                    className="team-edit-toggle"
                    aria-expanded={showEditForm}
                    onClick={() => setShowEditForm((prev) => !prev)}
                  >
                    {showEditForm ? "Закрыть" : "Редактировать"}
                  </button>
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

            {!loading && !error && (
              <section className="team-members" aria-labelledby="team-members-title">
                <div className="team-section-head">
                  <div>
                    <p className="team-section-kicker">Состав и обращения</p>
                    <h2 id="team-members-title">{currentContent}</h2>
                  </div>
                </div>
                {renderMainContent()}
              </section>
            )}
          </MainContent>
        </div>
      </main>
    </>
  );
};

export default TeamProfilePage;
