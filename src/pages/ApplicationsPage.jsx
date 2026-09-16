import { Link } from 'react-router-dom';

import Navbar from '../components/navbar/Navbar';
import MainContent from '../components/main-section/MainSection';
import { useApplications } from '../context/applicationsContext';
import './ApplicationsPage.css';

const ApplicationsPage = () => {
  const { invites, requests, loading } = useApplications();
  const isTeamLead = requests.length > 0;

  const renderEmpty = () => (
    <p className="empty-state">
      Ничего не ждёт ответа. Приглашения от команд и заявки в вашу команду появятся здесь.
    </p>
  );

  return (
    <>
      <Navbar />
      <main className="container content-layout">
        <MainContent>
          <div className="catalog-head">
            <div>
              <p className="catalog-kicker">Проектная деятельность</p>
              <h1>Заявки</h1>
            </div>
          </div>

          {loading ? (
            <p className="loading-state">Загружаем заявки…</p>
          ) : invites.length === 0 && requests.length === 0 ? (
            renderEmpty()
          ) : (
            <div className="applications">
              {invites.length > 0 && (
                <section className="applications-section">
                  <h2>Приглашения в команды</h2>
                  <ul className="applications-list">
                    {invites.map((invite) => (
                      <li key={invite.id} className="application-row">
                        <Link to={`/teams/${invite.team?.id}`} className="application-subject">
                          {invite.team?.name ?? 'Команда'}
                        </Link>
                        <span className="application-status">Ожидает вашего ответа</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {isTeamLead && (
                <section className="applications-section">
                  <h2>Заявки в вашу команду</h2>
                  <ul className="applications-list">
                    {requests.map((request) => (
                      <li key={request.id} className="application-row">
                        <Link
                          to={`/students/${request.student?.id}`}
                          className="application-subject"
                        >
                          {request.student?.fio ?? 'Участник'}
                        </Link>
                        <span className="application-status">Ожидает вашего решения</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </MainContent>
      </main>
    </>
  );
};

export default ApplicationsPage;
