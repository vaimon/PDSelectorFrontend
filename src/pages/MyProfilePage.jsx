import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";
import MainContent from "../components/main-section/MainSection";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import useStudentData from "../hooks/useStudentData";
import { useTechnologies } from "../hooks/useTechnologies";
import { useIdentity } from "../context/identityContext";
import { useNotifications } from "../context/notificationContext";
import { updateStudent } from "../api/apiStudentsController";
import "./CabinetPage.css";

/**
 * The student's own questionnaire (#64): who they are in this selection, and the form to change it.
 *
 * Its own page, reached from the account menu, because the cabinet it used to share a sidebar with
 * becomes unreachable the moment a team exists — the navbar item then points at the team instead.
 */
const MyProfilePage = () => {
  const { studentId, loading: identityLoading } = useIdentity();
  const { studentData, loading, error, refresh } = useStudentData(studentId);
  const { allTechnologies } = useTechnologies();
  const { notify } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (updatedData) => {
    try {
      await updateStudent(updatedData, studentId);
      setIsEditing(false);
      refresh();
      notify({ type: "success", text: "Профиль обновлён" });
    } catch (saveError) {
      // The shared client already showed what went wrong; the form stays open.
      console.error("Не удалось сохранить профиль:", saveError);
    }
  };

  const renderBody = () => {
    if (identityLoading || loading) {
      return <p className="loading-state">Загрузка…</p>;
    }

    // Signed in, but no participant questionnaire: a normal state for an admin or a newcomer.
    if (!studentId) {
      return (
        <p className="empty-state">
          Анкета участника не заполнена.{" "}
          <Link to="/registration">Заполнить анкету</Link>
        </p>
      );
    }

    if (error) {
      return <p className="empty-state" role="alert">{error}</p>;
    }

    // The student id arrives with identity, one render after the page mounts.
    if (!studentData) {
      return <p className="loading-state">Загрузка…</p>;
    }

    return isEditing ? (
      <ProfileEditForm
        studentData={studentData}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
        allTechnologies={allTechnologies}
      />
    ) : (
      <ProfileCard studentData={studentData} onEdit={() => setIsEditing(true)} isCurrentUser />
    );
  };

  return (
    <>
      <Navbar />
      <main className="page-container cabinet-page">
        <div className="cabinet-layout cabinet-layout--single">
          <MainContent>
            <section className="cabinet-section" aria-labelledby="my-profile-title">
              <div className="cabinet-section-head">
                <h1 id="my-profile-title">Мой профиль</h1>
                {studentData?.user?.fio && (
                  <span className="cabinet-person">{studentData.user.fio}</span>
                )}
              </div>
              {renderBody()}
            </section>
          </MainContent>
        </div>
      </main>
    </>
  );
};

export default MyProfilePage;
