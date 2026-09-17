import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import Navbar from "../components/navbar/Navbar";
import MainContent from "../components/main-section/MainSection";
import ProfileCard from "../components/profile/ProfileCard";
import useStudentData from "../hooks/useStudentData";
import "./StudentProfile.css";

// Someone else's profile, reached from the catalogue. The signed-in student's own cabinet is a
// separate page (CabinetPage): it has sections, editing and a team, and none of that belongs here.
const StudentProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { studentData, loading, error } = useStudentData(studentId);

  const renderContent = () => {
    if (loading) {
      return <p className="loading-state">Загрузка…</p>;
    }

    if (error) {
      return <p className="empty-state" role="alert">{error}</p>;
    }

    return <ProfileCard studentData={studentData} isCurrentUser={false} />;
  };

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
            <h1>Профиль участника</h1>
          </div>
        </header>

        <div className="student-profile-layout">
          <MainContent>
            <section className="student-profile-section" aria-labelledby="student-section-title">
              <div className="student-profile-section-head">
                <h2 id="student-section-title">Профиль</h2>
                {studentData?.user?.fio && (
                  <span className="student-profile-person">{studentData.user.fio}</span>
                )}
              </div>
              {renderContent()}
            </section>
          </MainContent>
        </div>
      </main>
    </>
  );
};

export default StudentProfilePage;
