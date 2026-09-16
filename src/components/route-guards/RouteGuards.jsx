import { Link } from 'react-router-dom';

import Navbar from '../navbar/Navbar';
import { useIdentity } from '../../context/identityContext';

const StatusScreen = ({ title, children }) => (
  <>
    <Navbar />
    <main className="status-page">
      <h1>{title}</h1>
      {children}
    </main>
  </>
);

/**
 * The catalogue, profiles and applications are `Access.PARTICIPANT_OR_ADMIN` on the backend: an
 * account without a questionnaire for the current selection gets 403. Saying so is better than
 * rendering a page that fails behind the scenes.
 */
export const RequireParticipant = ({ children }) => {
  const { isParticipant, isAdmin, activeTrack, loading } = useIdentity();

  if (loading) {
    return <StatusScreen title="Загрузка"><p>Проверяем данные учётной записи…</p></StatusScreen>;
  }

  if (isParticipant || isAdmin) {
    return children;
  }

  // Nobody is a participant between two selections, and that is not the student's doing — sending
  // them to the questionnaire here would be a dead end.
  if (!activeTrack) {
    return (
      <StatusScreen title="Отбор не идёт">
        <p>Сейчас нет активного набора. Разделы отбора откроются, когда начнётся следующий.</p>
      </StatusScreen>
    );
  }

  return (
    <StatusScreen title="Нужна анкета участника">
      <p>
        Этот раздел доступен участникам текущего отбора.{' '}
        <Link to="/registration">Заполнить анкету</Link>
      </p>
    </StatusScreen>
  );
};

export const RequireAdmin = ({ children }) => {
  const { isAdmin, loading } = useIdentity();

  if (loading) {
    return <StatusScreen title="Загрузка"><p>Проверяем данные учётной записи…</p></StatusScreen>;
  }

  if (isAdmin) {
    return children;
  }

  return (
    <StatusScreen title="Недостаточно прав">
      <p>
        Раздел администрирования доступен только организаторам.{' '}
        <Link to="/teams">Вернуться к командам</Link>
      </p>
    </StatusScreen>
  );
};
