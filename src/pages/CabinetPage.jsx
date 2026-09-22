import { Link } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";
import MainContent from "../components/main-section/MainSection";
import Card from "../components/card/Card";
import Modal from "../components/forms/modal/Modal";
import TeamForm from "../components/forms/TeamForm";
import useStudentData from "../hooks/useStudentData";
import { useNewTeam } from "../hooks/useNewTeam";
import { useModal } from "../hooks/useModal";
import { useTechnologies } from "../hooks/useTechnologies";
import { useProjectTypes } from "../hooks/useProjectTypes";
import { useIdentity } from "../context/identityContext";
import { useNotifications } from "../context/notificationContext";
import { describeMissing } from "../utils/composition";
import "./CabinetPage.css";

/**
 * «Моя команда»: the team the student is in, or the way to start one (#64).
 *
 * The questionnaire used to be the other half of this page. It moved to its own page, reachable
 * from the account menu, because this one stops being reachable as soon as a team exists — the
 * navbar item then points at the team's own page.
 */
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
              : "Набора сейчас нет — команды появятся, когда начнётся следующий."}
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

    return renderTeam();
  };

  return (
    <>
      <Navbar />
      <main className="page-container cabinet-page">
        <div className="cabinet-layout cabinet-layout--single">
          <MainContent>
            <section className="cabinet-section" aria-labelledby="cabinet-section-title">
              <div className="cabinet-section-head">
                <h1 id="cabinet-section-title">Моя команда</h1>
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
