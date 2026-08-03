import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaFileAlt, FaLayerGroup, FaUser, FaUsers } from "react-icons/fa";
import Sidebar from "../components/sidebar/Sidebar";
import MainContent from "../components/main-section/MainSection";
import Card from "../components/card/Card";
import Navbar from "../components/navbar/Navbar";
import useStudentData from "../hooks/useStudentData";
import useCurrentUser from "../hooks/useCurrentUser";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import ApplicationCard from "../components/card/ApplicationCard";
import useSuccessMessage from "../hooks/useSuccessMessage";
import { updateApplication } from "../api/apiApplication";
import { fetchApplicationById } from "../api/apiApplication";
import TeamForm from "../components/forms/TeamForm";
import { useNewTeam } from "../hooks/useNewTeam";
import Cookies from "js-cookie";
import Modal from "../components/forms/modal/Modal";
import { useModal } from "../hooks/useModal";
import { useTechnologies } from "../hooks/useTechnologies";
import { updateStudent } from "../api/apiStudentsController";
import { useProjectTypes } from "../hooks/useProjectTypes";
import "./StudentProfile.css";
const sidebarItems = [
  { name: "Мои команды", icon: <FaUsers aria-hidden="true" /> },
  { name: "Мой профиль", icon: <FaUser aria-hidden="true" /> },
  { name: "Мои заявки", icon: <FaFileAlt aria-hidden="true" /> },
  { name: "Созданные команды", icon: <FaLayerGroup aria-hidden="true" /> },
];



const StudentProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const profileStudentId = studentId || currentUser;
  const { allTypes } = useProjectTypes();
  const {
    studentData,
    myTeams,
    createdTeams,
    submittedRequests,
    loading,
    error,
    isCurrentUser,
    refreshStudentData,
  } = useStudentData(profileStudentId, currentUser);
   

  const { allTechnologies } = useTechnologies();
  const currentTrackId = Cookies.get("trackId");
  const { newTeam, handleChange, handleSubmit } = useNewTeam(currentTrackId, profileStudentId, allTechnologies, allTypes);

  const { successMessage, showSuccessMessage } = useSuccessMessage();
  const { showModal, toggleModal } = useModal();

  const [currentContent, setCurrentContent] = useState("Мой профиль");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);


  const handleProfileSave = async (updatedData) => {
    try {
      await updateStudent(updatedData, profileStudentId);
      setIsEditingProfile(false);
      refreshStudentData();
    } catch (error) {
      console.error("Ошибка при сохранении профиля:", error);
    }
  };
  

  const handleProfileEdit = () => setIsEditingProfile(true);
  const handleProfileCancel = () => setIsEditingProfile(false);


  const handleApplicationStatusChange = async (applicationId, status) => {
    try {
      const applicationData = await fetchApplicationById(applicationId);
      applicationData.status = status;
      await updateApplication(applicationData);
      showSuccessMessage(`Заявка успешно ${status.toLowerCase()}`);
      refreshStudentData();
    } catch (err) {
      console.error(`Ошибка изменения статуса заявки: ${status}`, err);
    }
  };


  const handleTeamCreate = async (e) => {
    e.preventDefault();

    try {
      await handleSubmit(e);
      setIsCreatingTeam(false);
      showSuccessMessage("Команда успешно создана");
      toggleModal(); 
      refreshStudentData();
    } catch (err) {
      console.error("Ошибка создания команды", err);
      alert("Не удалось создать команду");
    }
  };

  const handleCreateTeamClick = () => {
    setIsCreatingTeam(true);
    toggleModal(); 
  };

  const renderProfileContent = () => {
    if (isCurrentUser&&isEditingProfile) {
      return <ProfileEditForm studentData={studentData} onSave={handleProfileSave} onCancel={handleProfileCancel} allTechnologies={allTechnologies}/>;
    }
    return <ProfileCard studentData={studentData} onEdit={handleProfileEdit} isCurrentUser={isCurrentUser}/>;
  };

  const renderMyTeams = () => (
    <div className="cards">
      {myTeams.length > 0 ? (
        myTeams.map((team) => (
          <Card key={team.id} name={team.name} type={team.project_type.name} resume={team.project_description} tags={team.technologies} profileLink={`/teams/${team.id}`} />
        ))
      ) : (
        <p>У вас нет команд</p>
      )}
    </div>
  );

  const renderApplications = () => (
    <div className="cards">
      {submittedRequests.length > 0 ? (
        submittedRequests.map((request) => (
          <ApplicationCard
            key={request.id}
            applicationId={request.id}
            studentName={request.student.fio}
            teamName={request.team.name}
            teamDescription={request.team.project_description}
            technologies={request.team.technologies}
            status={request.status}
            studentId={request.student.id}
            teamId={request.team.id}
            onReject={() => handleApplicationStatusChange(request.id, "Rejected")}
            onCancel={() => handleApplicationStatusChange(request.id, "Cancelled")}
            onSending={() => handleApplicationStatusChange(request.id, "Sent")}
          />
        ))
      ) : (
        <p>Нет поданных заявок</p>
      )}
    </div>
  );

  const renderCreatedTeams = () => (
    <div className="cards">
      {showModal && (
        <Modal show={showModal} onClose={toggleModal}>
          {isCreatingTeam && (
            <TeamForm
              newTeam={newTeam}
              onChange={handleChange}
              onSubmit={handleTeamCreate}
              onCancel={() => setIsCreatingTeam(false)}
              technologies={allTechnologies}
              currentTrackId={currentTrackId}
              projectTypes={allTypes}
            />
          )}
        </Modal>
      )}
      <button onClick={handleCreateTeamClick}>Создать команду</button>
      {createdTeams.length > 0 ? (
        createdTeams.map((team) => (
          <Card key={team.id} name={team.name} type={team.project_type.name} resume={team.project_description} tags={team.technologies} profileLink={`/teams/${team.id}`} />
        ))
      ) : (
        <p>Вы не создали команд.</p>
      )}
    </div>
  );

  const renderMainContent = () => {
    
    if (error) return <p>{error}</p>;
    if (loading) return <p>Загрузка...</p>;
    switch (currentContent) {
      case "Мой профиль":
        return renderProfileContent();
      case "Мои команды":
        return renderMyTeams();
      case "Мои заявки":
        return renderApplications();
      case "Созданные команды":
        return renderCreatedTeams();
      default:
        return null;
    }
  };

  const sectionTitle = isCurrentUser ? currentContent : "Профиль";

  return (
    <>
      <Navbar />
      <main className="student-profile-page">
        <header className="student-profile-toolbar">
          <button
            type="button"
            className="student-back-button"
            onClick={() => navigate("/students")}
          >
            <FaArrowLeft aria-hidden="true" />
            <span>Назад к участникам</span>
          </button>
          <div className="student-profile-heading">
            <p>Участники</p>
            <h1>{isCurrentUser ? "Личный кабинет" : "Профиль участника"}</h1>
          </div>
        </header>

        <div className={`student-profile-layout${isCurrentUser ? "" : " student-profile-layout--single"}`}>
          {isCurrentUser && (
            <Sidebar
              onItemClick={setCurrentContent}
              items={sidebarItems}
              activeItem={currentContent}
            />
          )}
          <MainContent>
            <section className="student-profile-section" aria-labelledby="student-section-title">
              <div className="student-profile-section-head">
                <h2 id="student-section-title">{sectionTitle}</h2>
                {studentData?.user?.fio && (
                  <span className="student-profile-person">{studentData.user.fio}</span>
                )}
              </div>
              {successMessage && <div className="success-message">{successMessage}</div>}
              {renderMainContent()}
            </section>
          </MainContent>
        </div>
      </main>
    </>
  );
};

export default StudentProfilePage;
