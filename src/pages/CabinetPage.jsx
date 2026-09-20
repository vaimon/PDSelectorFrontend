import { useState } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaUsers } from "react-icons/fa";

import Navbar from "../components/navbar/Navbar";
import Sidebar from "../components/sidebar/Sidebar";
import MainContent from "../components/main-section/MainSection";
import Card from "../components/card/Card";
import Modal from "../components/forms/modal/Modal";
import TeamForm from "../components/forms/TeamForm";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import useStudentData from "../hooks/useStudentData";
import { useNewTeam } from "../hooks/useNewTeam";
import { useModal } from "../hooks/useModal";
import { useTechnologies } from "../hooks/useTechnologies";
import { useProjectTypes } from "../hooks/useProjectTypes";
import { useIdentity } from "../context/identityContext";
import { useNotifications } from "../context/notificationContext";
import { describeMissing } from "../utils/composition";
import { updateStudent } from "../api/apiStudentsController";
import "./CabinetPage.css";

const PROFILE = "Мой профиль";
const TEAM = "Моя команда";

const sidebarItems = [
  { name: PROFILE, icon: <FaUser aria-hidden="true" /> },
  { name: TEAM, icon: <FaUsers aria-hidden="true" /> },
];

const CabinetPage = () => {
  const {
    studentId,
    isParticipant,
    activeTrack,
    loading: identityLoading,
    refresh: refreshIdentity,
  } = useIdentity();
  const { studentData, currentTeam, loading, error, refresh } = useStudentData(studentId);
  const { notify } = useNotifications();

  // A student record keeps last selection's team until the questionnaire is filled in again
  // (StudentService.create clears it only then), so a team counts as mine only while I am taking
  // part in the current selection.
  const myTeam = isParticipant ? currentTeam : null;

  const { allTechnologies } = useTechnologies();
  const { allTypes } = useProjectTypes();
  const { newTeam, handleChange, submit } = useNewTeam(allTechnologies, allTypes);
  const { showModal, toggleModal } = useModal();

  const [currentSection, setCurrentSection] = useState(PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleProfileSave = async (updatedData) => {
    try {
      await updateStudent(updatedData, studentId);
      setIsEditingProfile(false);
      refresh();
      notify({ type: "success", text: "Профиль обновлён" });
    } catch (error) {
      // The shared client already showed what went wrong; the form stays open.
      console.error("Не удалось сохранить профиль:", error);
    }
  };

  const handleTeamCreate = async (event) => {
    event.preventDefault();

    try {
      if (!(await submit())) {
        return;
      }

      // Creating a team makes you its lead and puts you in it, so the shell has to see that too —
      // otherwise «Моя команда» in the navbar keeps pointing back here.
      await refreshIdentity();
      refresh();
      toggleModal();
      notify({ type: "success", text: "Команда создана" });
    } catch (error) {
      console.error("Не удалось создать команду:", error);
    }
  };

  const renderProfile = () => {
    if (isEditingProfile) {
      return (
        <ProfileEditForm
          studentData={studentData}
          onSave={handleProfileSave}
          onCancel={() => setIsEditingProfile(false)}
          allTechnologies={allTechnologies}
        />
      );
    }

    return (
      <ProfileCard
        studentData={studentData}
        onEdit={() => setIsEditingProfile(true)}
        isCurrentUser
      />
    );
  };

  const renderTeam = () => {
    if (myTeam) {
      return (
        <div className="cards">
          <Card
            variant="team"
            name={myTeam.name}
            type={myTeam.project_type?.name}
            resume={myTeam.project_description}
            tags={myTeam.technologies}
            profileLink={`/teams/${myTeam.id}`}
            // The first screen a lead sees after signing in: whether the team still needs anyone.
            // Silence when the composition is missing — «Команда собрана» would be a claim.
            note={myTeam.composition
              ? describeMissing(myTeam.composition) ?? "Команда собрана"
              : undefined}
          />
        </div>
      );
    }

    return (
      <div className="cabinet-empty">
        <p>Вы пока не в команде.</p>
        {isParticipant ? (
          <>
            <button type="button" className="cabinet-primary" onClick={toggleModal}>
              Создать команду
            </button>
            <p className="cabinet-empty-hint">
              Или найдите команду в <Link to="/teams">каталоге</Link> — отправленные заявки видны
              в разделе <Link to="/applications">«Заявки»</Link>.
            </p>
          </>
        ) : (
          <p className="cabinet-empty-hint">
            {activeTrack
              ? "Действия участника откроются после заполнения анкеты текущего набора."
              : "Отбор сейчас не идёт — команды появятся, когда начнётся новый набор."}
          </p>
        )}
      </div>
    );
  };

  const renderSection = () => {
    if (identityLoading || loading) {
      return <p className="loading-state">Загрузка…</p>;
    }

    // Signed in, but no participant questionnaire: a normal state for an admin or a newcomer.
    if (!studentId) {
      return (
        <p className="empty-state">
          Анкета участника не заполнена, поэтому личного кабинета пока нет.{" "}
          <Link to="/registration">Заполнить анкету</Link>
        </p>
      );
    }

    if (error) {
      return <p className="empty-state" role="alert">{error}</p>;
    }

    // The student id arrives with identity, one render after the page mounts, so the record is
    // still on its way here.
    if (!studentData) {
      return <p className="loading-state">Загрузка…</p>;
    }

    return currentSection === PROFILE ? renderProfile() : renderTeam();
  };

  const showSidebar = !identityLoading && Boolean(studentId);

  return (
    <>
      <Navbar />
      <main className="page-container cabinet-page">
        <header className="cabinet-heading">
          <p>Проектная деятельность</p>
          <h1>Личный кабинет</h1>
        </header>

        <div className={`cabinet-layout${showSidebar ? "" : " cabinet-layout--single"}`}>
          {showSidebar && (
            <Sidebar
              onItemClick={setCurrentSection}
              items={sidebarItems}
              activeItem={currentSection}
            />
          )}
          <MainContent>
            <section className="cabinet-section" aria-labelledby="cabinet-section-title">
              <div className="cabinet-section-head">
                <h2 id="cabinet-section-title">{showSidebar ? currentSection : "Кабинет"}</h2>
                {studentData?.user?.fio && (
                  <span className="cabinet-person">{studentData.user.fio}</span>
                )}
              </div>
              {renderSection()}
            </section>
          </MainContent>
        </div>
      </main>

      <Modal show={showModal} onClose={toggleModal}>
        <TeamForm
          newTeam={newTeam}
          onChange={handleChange}
          onSubmit={handleTeamCreate}
          onCancel={toggleModal}
          technologies={allTechnologies}
          projectTypes={allTypes}
        />
      </Modal>
    </>
  );
};

export default CabinetPage;
