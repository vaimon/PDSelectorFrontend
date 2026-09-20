import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createStudent } from "../api/apiStudentsController";
import { previewJoin } from "../api/apiJoinLink";
import { logout } from "../api/apiAuth";
import RegistrationForm from "../components/login-form/RegistrationForm";
import AuthShell from "../components/login-form/AuthShell";
import useStudentData from "../hooks/useStudentData";
import { useTechnologies } from "../hooks/useTechnologies";
import { useIdentity } from "../context/identityContext";
import { useNotifications } from "../context/notificationContext";
import { forgetJoin, pendingJoin } from "../utils/pendingJoin";
import "../components/login-form/style.css";

// Only the first course counts as a first-year place (TeamComposition.isFirstYear), the rest share
// the second-year ones; the list just keeps an impossible course from being picked.
const coursesFor = (trackType) => (trackType === "master" ? [1, 2] : [1, 2, 3, 4]);

const Notice = ({ title, children }) => (
  <AuthShell title={title}>
    <div className="login-purpose">{children}</div>
  </AuthShell>
);

const Registration = () => {
  const navigate = useNavigate();
  const { user, studentId, isAdmin, activeTrack, loading, refresh } = useIdentity();
  const { notify } = useNotifications();
  const { allTechnologies } = useTechnologies();
  // A returning student already has a record; its fields prefill the form.
  const { studentData, loading: studentLoading } = useStudentData(studentId);
  const [submitting, setSubmitting] = useState(false);
  // Someone who came through a join link goes back to the invitation instead of the cabinet.
  const [joinTarget] = useState(pendingJoin);
  const [invitedTeam, setInvitedTeam] = useState(null);

  useEffect(() => {
    if (!joinTarget || loading || !user) {
      return;
    }
    previewJoin(joinTarget.slice("/join/".length))
      .then((preview) => setInvitedTeam(preview.teamName))
      // The note is a courtesy; without the name it still says where the form leads.
      .catch(() => setInvitedTeam(""));
  }, [joinTarget, loading, user]);

  // A fresh object on every render would restart the form's prefill effect endlessly.
  const initialValues = useMemo(() => (studentData ? {
    course: studentData.course ?? "",
    groupNumber: studentData.group_number ?? "",
    contacts: studentData.contacts ?? "",
    aboutSelf: studentData.about_self ?? "",
    technologies: studentData.technologies ?? [],
  } : null), [studentData]);

  const handleLeave = async () => {
    try {
      await logout();
      window.location.assign("/login");
    } catch (error) {
      console.error("Не удалось выйти:", error);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // The questionnaire belongs to the account filling it in, and the backend joins it to the
      // active selection itself — a track id in the body is ignored.
      await createStudent({ ...values, user_id: user.id });
      // The account is a participant now, so the shell has to see it.
      await refresh();
      notify({ type: "success", text: "Анкета сохранена" });
      // Used once: the invitation page takes it from here.
      forgetJoin();
      // An invitation is the one thing more urgent than the explanation; everyone else has just
      // signed up for something nobody has explained to them yet.
      navigate(joinTarget ?? "/how-it-works");
    } catch (error) {
      // The shared client already showed the backend's reason; the form keeps what was typed.
      console.error("Не удалось сохранить анкету:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // The returning student's record has to be here before the form is: otherwise it would land in
  // the middle of typing and overwrite it.
  if (loading || (studentId != null && studentLoading)) {
    return <Notice title="Загрузка"><p>Проверяем данные учётной записи…</p></Notice>;
  }

  if (isAdmin) {
    return (
      <Notice title="Администратор не участвует в наборе">
        <p>
          Анкета участника нужна только студентам.{" "}
          <Link to="/admin">Перейти в администрирование</Link>
        </p>
      </Notice>
    );
  }

  if (!activeTrack) {
    return (
      <Notice title="Набор не идёт">
        <p>Сейчас нет активного набора. Анкету можно будет заполнить, когда начнётся следующий.</p>
      </Notice>
    );
  }

  return (
    <RegistrationForm
      user={user}
      courses={coursesFor(activeTrack.type)}
      technologies={allTechnologies}
      initialValues={initialValues}
      isReturning={studentId != null}
      invitedTeam={joinTarget ? invitedTeam ?? "" : null}
      submitting={submitting}
      onSubmit={handleSubmit}
      onLeave={handleLeave}
    />
  );
};

export default Registration;
