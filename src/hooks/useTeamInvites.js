import { cancelApplication, resendApplication, sendInvite } from '../api/apiApplication';
import { useApplications } from '../context/applicationsContext';
import { useIdentity } from '../context/identityContext';
import { isPendingApplication } from '../utils/applicationStatus';
import { selectionClosedReason } from '../utils/selectionWindow';
import { useConfirmAction } from './useConfirmAction';

// Course 1 takes a first-year place, every later course a second-year one (TeamComposition).
const placesLeftFor = (composition, course) => (
  course === 1 ? composition?.first_year_places_left : composition?.second_year_places_left
);

/**
 * The lead's button next to a student, in the catalogue and on the student's page.
 *
 * What it offers depends on the invite their team already sent that student: none, one waiting for
 * an answer, or one that was refused. A second `POST` is refused by the backend when a row already
 * exists, so reviving a refused invite is a resend.
 */
export const useTeamInvites = () => {
  const { studentId, isParticipant, isSelectionOpen, activeTrack } = useIdentity();
  const { sentInvites, myTeam, refresh } = useApplications();
  const { ask, confirmProps } = useConfirmAction(refresh);

  const closedReason = selectionClosedReason(activeTrack);

  const inviteActionFor = (student) => {
    // Only a lead invites, and only into their own team; a lead cannot invite themselves.
    if (!isParticipant || !myTeam || !student || student.id === studentId) {
      return null;
    }

    const name = student.user?.fio ?? 'Студента';
    const mine = sentInvites.find((invite) => invite.student?.id === student.id) ?? null;

    if (mine && isPendingApplication(mine)) {
      return {
        label: 'Отменить приглашение',
        tone: 'cancel',
        // Cancelling is a student mutation too, so the backend refuses it outside the window.
        disabled: !isSelectionOpen,
        reason: isSelectionOpen ? null : closedReason,
        onClick: () => ask({
          heading: 'Отменить приглашение?',
          description: `${name} больше не увидит приглашение в «${myTeam.name}». Пригласить снова можно будет отсюда же.`,
          confirmText: 'Отменить приглашение',
          successText: 'Приглашение отменено',
          run: () => cancelApplication(mine),
        }),
      };
    }

    // Reasons the backend would refuse anyway, said before the click instead of after it.
    const placesLeft = placesLeftFor(myTeam.composition, student.course);
    // The validator compares the student's selection with the team's, not with the active one.
    // Note the two shapes: a team carries `current_track` as a bare id, a student as an object
    // whose `id` comes back null from the catalogue (only the name is filled), so the id comes
    // from the nested user record. When neither says, the button stays enabled and the backend
    // has the last word.
    const studentTrackId = student.current_track?.id ?? student.user?.student?.current_track_id ?? null;
    const inThisSelection = studentTrackId == null || studentTrackId === myTeam.current_track;
    const reason = !isSelectionOpen ? closedReason
      : student.has_team ? `${name} уже состоит в команде.`
        : !inThisSelection ? `${name} не участвует в текущем наборе.`
          : placesLeft === 0 ? `В команде не осталось мест для ${student.course === 1 ? '1 курса' : '2 курса и старше'}.`
            : null;

    const sendAgain = mine != null;
    return {
      label: sendAgain ? 'Пригласить снова' : 'Пригласить',
      tone: 'primary',
      disabled: Boolean(reason),
      reason,
      onClick: () => ask({
        heading: 'Пригласить в команду?',
        description: `${name} увидит приглашение в «${myTeam.name}» и решит сам. Приняв его, он войдёт в состав, а его собственные заявки отменятся.`,
        confirmText: 'Пригласить',
        successText: 'Приглашение отправлено',
        run: () => (sendAgain ? resendApplication(mine) : sendInvite(student.id, myTeam.id)),
      }),
    };
  };

  return { inviteActionFor, confirmProps };
};

export default useTeamInvites;
