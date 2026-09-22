import { cancelApplication, resendApplication, sendRequest } from '../api/apiApplication';
import { useApplications } from '../context/applicationsContext';
import { useIdentity } from '../context/identityContext';
import { isPendingApplication } from '../utils/applicationStatus';
import { noPlacesMessage, placesLeftFor } from '../utils/composition';
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
  const course = user?.student?.course;
  const closedReason = selectionClosedReason(activeTrack);

  const applyActionFor = (team) => {
    // A student who already has a team cannot apply anywhere, and the backend says so too.
    if (!isParticipant || hasTeam || !team) {
      return null;
    }

    const mine = myRequests.find((application) => application.team?.id === team.id) ?? null;
    const teamName = team.name ?? 'команду';

    // Cancelling is a mutation like any other, so it follows the window — but a full team is no
    // reason to keep someone's own application alive.
    // `blockedLabel` is what the button says once it is off for `extraReason`: on a card the button
    // itself carries the answer («Нет места») and the sentence is its hover (#59).
    const action = (label, request, extraReason = null, blockedLabel = null) => ({
      label: extraReason && blockedLabel ? blockedLabel : label,
      disabled: !isSelectionOpen || Boolean(extraReason),
      reason: !isSelectionOpen ? closedReason : extraReason,
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

    // A team can be short of one year and full for the other, so «есть свободные места» is not the
    // same as «есть место для меня». The backend refuses such an application; this says so first.
    const noPlace = placesLeftFor(team.composition, course) === 0 ? noPlacesMessage(course) : null;

    const sendAgain = mine != null;
    return action(sendAgain ? 'Подать заявку снова' : 'Подать заявку', {
      heading: 'Отправить заявку?',
      description: `Команда «${teamName}» увидит вашу заявку, и её тимлид решит, брать ли вас в состав.`,
      confirmText: 'Отправить',
      successText: 'Заявка отправлена',
      run: () => (sendAgain ? resendApplication(mine) : sendRequest(studentId, team.id)),
    }, noPlace, "Нет места");
  };

  return { applyActionFor, confirmProps };
};

export default useTeamRequests;
