import { cancelApplication, resendApplication, sendRequest } from '../api/apiApplication';
import { useApplications } from '../context/applicationsContext';
import { useIdentity } from '../context/identityContext';
import { isPendingApplication } from '../utils/applicationStatus';
import { selectionClosedReason } from '../utils/selectionWindow';
import { useConfirmAction } from './useConfirmAction';

/**
 * The button under a team in the catalogue and on the team page.
 *
 * What it offers depends on the student's own application to that team: none yet, one waiting for
 * an answer, or one that was rejected or cancelled. A second `POST` is refused by the backend when
 * a row already exists, so reviving an old application is a resend, not a new request.
 */
export const useTeamRequests = () => {
  const { studentId, user, isParticipant, isSelectionOpen, activeTrack } = useIdentity();
  const { myRequests, refresh } = useApplications();
  const { ask, confirmProps } = useConfirmAction(refresh);

  const hasTeam = user?.student?.current_team_id != null;
  const closedReason = selectionClosedReason(activeTrack);

  const applyActionFor = (team) => {
    // A student who already has a team cannot apply anywhere, and the backend says so too.
    if (!isParticipant || hasTeam || !team) {
      return null;
    }

    const mine = myRequests.find((application) => application.team?.id === team.id) ?? null;
    const teamName = team.name ?? 'команду';

    const action = (label, request) => ({
      label,
      disabled: !isSelectionOpen,
      reason: isSelectionOpen ? null : closedReason,
      onClick: () => ask(request),
    });

    if (mine && isPendingApplication(mine)) {
      return action('Отменить заявку', {
        heading: 'Отменить заявку?',
        description: `Заявка в «${teamName}» будет отменена. Отправить её снова можно будет отсюда же.`,
        confirmText: 'Отменить заявку',
        successText: 'Заявка отменена',
        run: () => cancelApplication(mine),
      });
    }

    const sendAgain = mine != null;
    return action(sendAgain ? 'Подать заявку снова' : 'Подать заявку', {
      heading: 'Отправить заявку?',
      description: `Команда «${teamName}» увидит вашу заявку, и её тимлид решит, брать ли вас в состав.`,
      confirmText: 'Отправить',
      successText: 'Заявка отправлена',
      run: () => (sendAgain ? resendApplication(mine) : sendRequest(studentId, team.id)),
    });
  };

  return { applyActionFor, confirmProps };
};

export default useTeamRequests;
