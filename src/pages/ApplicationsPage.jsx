import { Link } from 'react-router-dom';

import Navbar from '../components/navbar/Navbar';
import MainContent from '../components/main-section/MainSection';
import { useApplications } from '../context/applicationsContext';
import { describeApplicationStatus } from '../utils/applicationStatus';
import './ApplicationsPage.css';

const ApplicationsPage = () => {
  const { invites, requests, myRequests, loading } = useApplications();
  const isEmpty = invites.length === 0 && requests.length === 0 && myRequests.length === 0;

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
          ) : isEmpty ? (
            <p className="empty-state">
              Ничего не ждёт ответа. Здесь появятся приглашения от команд и заявки,{' '}
              которые вы отправите из <Link to="/teams">каталога</Link>.
            </p>
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

              {requests.length > 0 && (
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

              {myRequests.length > 0 && (
                <section className="applications-section">
                  <h2>Мои отправленные заявки</h2>
                  <ul className="applications-list">
                    {myRequests.map((request) => {
                      const status = describeApplicationStatus(request.status);
                      return (
                        <li key={request.id} className="application-row">
                          <Link to={`/teams/${request.team?.id}`} className="application-subject">
                            {request.team?.name ?? 'Команда'}
                          </Link>
                          <span className={`application-status application-status--${status.tone}`}>
                            {status.text}
                          </span>
                        </li>
                      );
                    })}
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
