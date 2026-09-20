import { Link } from 'react-router-dom';

import Navbar from '../components/navbar/Navbar';
import MainContent from '../components/main-section/MainSection';
import ConfirmDialog from '../components/confirm-dialog/ConfirmDialog';
import { useApplications } from '../context/applicationsContext';
import { useIdentity } from '../context/identityContext';
import {
  acceptApplication,
  cancelApplication,
  rejectApplication,
} from '../api/apiApplication';
import { describeApplicationStatus, isPendingApplication } from '../utils/applicationStatus';
import { selectionClosedReason } from '../utils/selectionWindow';
import { useConfirmAction } from '../hooks/useConfirmAction';
import './ApplicationsPage.css';


const ApplicationsPage = () => {
  const { invites, requests, myRequests, sentInvites, loading, refresh } = useApplications();
  const { activeTrack, isSelectionOpen, refresh: refreshIdentity } = useIdentity();
  // Accepting puts the student in a team, which is identity, not just a list of applications: the
  // shell would otherwise keep offering «Подать заявку» until the next full page load.
  const { ask, confirmProps } = useConfirmAction(
    () => Promise.all([refreshIdentity(), refresh()]),
  );

  const closedReason = selectionClosedReason(activeTrack);
  const isEmpty = invites.length === 0 && requests.length === 0
    && myRequests.length === 0 && sentInvites.length === 0;

  const renderAction = (label, variant, request) => (
    <button
      type="button"
      className={`application-action application-action--${variant}`}
      onClick={() => ask(request)}
      disabled={!isSelectionOpen}
      title={closedReason ?? undefined}
    >
      {label}
    </button>
  );

  return (
    <>
      <Navbar />
      <main className="page-container content-layout">
        <MainContent>
          <div className="catalog-head">
            <div>
              <p className="catalog-kicker">Проектная деятельность</p>
              <h1>Заявки</h1>
            </div>
          </div>

          {closedReason && !loading && (
            <p className="applications-window" role="status">{closedReason}</p>
          )}

          {loading ? (
            <p className="loading-state">Загружаем заявки…</p>
          ) : isEmpty ? (
            <p className="empty-state">
              Ничего не ждёт ответа. Здесь появятся приглашения от команд, заявки,{' '}
              которые вы отправите из <Link to="/teams">каталога</Link>, и приглашения,{' '}
              которые вы отправите из <Link to="/students">списка участников</Link>.
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
                        <span className="application-actions">
                          {renderAction('Принять', 'accept', {
                            heading: 'Принять приглашение?',
                            description: `Вы войдёте в состав «${invite.team?.name}», а ваши собственные заявки в другие команды будут отменены. Решение необратимо.`,
                            confirmText: 'Принять',
                            successText: 'Вы в команде',
                            run: () => acceptApplication(invite),
                          })}
                          {renderAction('Отклонить', 'reject', {
                            heading: 'Отклонить приглашение?',
                            description: `Вы не войдёте в «${invite.team?.name}». Позвать вас снова сможет только тимлид команды.`,
                            confirmText: 'Отклонить',
                            successText: 'Приглашение отклонено',
                            run: () => rejectApplication(invite),
                          })}
                        </span>
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
                        <span className="application-actions">
                          {renderAction('Принять', 'accept', {
                            heading: 'Принять в команду?',
                            description: `${request.student?.fio} войдёт в состав команды. Решение необратимо.`,
                            confirmText: 'Принять',
                            successText: 'Заявка принята',
                            run: () => acceptApplication(request),
                          })}
                          {renderAction('Отклонить', 'reject', {
                            heading: 'Отклонить заявку?',
                            description: `${request.student?.fio} не войдёт в команду. Отправить заявку заново сможет только он сам.`,
                            confirmText: 'Отклонить',
                            successText: 'Заявка отклонена',
                            run: () => rejectApplication(request),
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {sentInvites.length > 0 && (
                <section className="applications-section">
                  <h2>Отправленные приглашения</h2>
                  <ul className="applications-list">
                    {sentInvites.map((invite) => {
                      const status = describeApplicationStatus(invite.status);
                      const name = invite.student?.fio ?? 'Участник';
                      return (
                        <li key={invite.id} className="application-row">
                          <Link to={`/students/${invite.student?.id}`} className="application-subject">
                            {name}
                          </Link>
                          <span className="application-actions">
                            <span className={`application-status application-status--${status.tone}`}>
                              {status.text}
                            </span>
                            {isPendingApplication(invite) && renderAction('Отменить', 'cancel', {
                              heading: 'Отменить приглашение?',
                              description: `${name} больше не увидит приглашение. Пригласить снова можно будет из списка участников.`,
                              confirmText: 'Отменить приглашение',
                              successText: 'Приглашение отменено',
                              run: () => cancelApplication(invite),
                            })}
                          </span>
                        </li>
                      );
                    })}
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
                          <span className="application-actions">
                            <span className={`application-status application-status--${status.tone}`}>
                              {status.text}
                            </span>
                            {isPendingApplication(request) && renderAction('Отменить', 'cancel', {
                              heading: 'Отменить заявку?',
                              description: `Заявка в «${request.team?.name}» будет отменена. Отправить её снова можно будет из каталога.`,
                              confirmText: 'Отменить заявку',
                              successText: 'Заявка отменена',
                              run: () => cancelApplication(request),
                            })}
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

      <ConfirmDialog {...confirmProps} />
    </>
  );
};

export default ApplicationsPage;
