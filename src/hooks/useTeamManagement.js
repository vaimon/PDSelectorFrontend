import { useNavigate } from 'react-router-dom';

import { disbandTeam, leaveTeam, removeMember, transferCaptaincy } from '../api/apiTeamsController';
import { useApplications } from '../context/applicationsContext';
import { useIdentity } from '../context/identityContext';
import { selectionClosedReason } from '../utils/selectionWindow';
import { useConfirmAction } from './useConfirmAction';

/**
 * What a team's own people can do with its roster: the lead removes a member or hands over the
 * lead role, a member leaves, the lead disbands the team.
 *
 * Membership is identity, not just a list: `has_team` decides what the shell offers and
 * `is_captain` decides whose applications are whose, so every one of these reloads identity and
 * the applications state together with the team (#37). The two that end the viewer's membership
 * have nothing left to reload on this page and take it away instead.
 */
export const useTeamManagement = ({ team, isCaptain, refresh }) => {
  const navigate = useNavigate();
  const { studentId, activeTrack, isSelectionOpen, refresh: refreshIdentity } = useIdentity();
  const { refresh: refreshApplications } = useApplications();

  const reloadEverything = () => Promise.all([refresh(), refreshIdentity(), refreshApplications()]);
  // Identity has to be right before the catalogue renders, or it keeps offering «Подать заявку» to
  // someone it still believes is in a team. The applications state needs no push: its provider
  // refetches on every navigation, and this is one.
  const leavePage = async () => {
    await refreshIdentity();
    navigate('/teams');
  };

  const { ask, confirmProps } = useConfirmAction(reloadEverything);

  // Every operation here goes through TeamService.loadForMutation, which refuses them outside the
  // window exactly as it refuses a student's own applications.
  const closedReason = selectionClosedReason(activeTrack);
  const gate = { disabled: !isSelectionOpen, reason: isSelectionOpen ? null : closedReason };

  const memberActionsFor = (member) => {
    // Only the lead manages other people, and never their own card: the lead cannot be removed
    // and is already the lead.
    if (!isCaptain || !team?.id || member.id === team.captain?.id) {
      return [];
    }

    const name = member.user?.fio ?? member.fio ?? 'Участник';
    return [
      {
        key: 'transfer',
        label: 'Сделать тимлидом',
        tone: 'primary',
        ...gate,
        onClick: () => ask({
          heading: 'Передать роль тимлида?',
          description: `${name} станет тимлидом «${team.name}», а вы — обычным участником: редактировать команду, приглашать и отвечать на заявки будет он. Вернуть роль сможете только через него.`,
          confirmText: 'Передать',
          successText: 'Теперь команду ведёт другой человек',
          run: () => transferCaptaincy(team.id, member.id),
        }),
      },
      {
        key: 'remove',
        label: 'Исключить',
        tone: 'cancel',
        ...gate,
        onClick: () => ask({
          heading: 'Исключить участника?',
          description: `${name} покинет «${team.name}» и освободит место для своего курса. Вернуться он сможет по заявке или по ссылке-приглашению.`,
          confirmText: 'Исключить',
          successText: 'Участник исключён',
          run: () => removeMember(team.id, member.id),
        }),
      },
    ];
  };

  // The one action the viewer performs on themselves. The lead has no way out that keeps the team:
  // they hand over the role or disband it.
  const selfActionOf = () => {
    const inThisTeam = team?.students?.some((member) => member.id === studentId);
    if (!team?.id || !inThisTeam) {
      return null;
    }

    if (isCaptain) {
      const size = team.students.length;
      return {
        label: 'Распустить команду',
        tone: 'cancel',
        ...gate,
        onClick: () => ask({
          heading: 'Распустить команду?',
          description: `«${team.name}» перестанет существовать: её участники (сейчас их ${size}, включая вас) освободятся, а заявки и приглашения исчезнут вместе с командой. Отменить это нельзя.`,
          confirmText: 'Распустить',
          successText: 'Команда распущена',
          run: () => disbandTeam(team.id),
          after: leavePage,
        }),
      };
    }

    return {
      label: 'Выйти из команды',
      tone: 'cancel',
      ...gate,
      onClick: () => ask({
        heading: 'Выйти из команды?',
        description: `Вы покинете «${team.name}» и освободите место для своего курса. Вернуться можно будет по заявке или по ссылке-приглашению.`,
        confirmText: 'Выйти',
        successText: 'Вы вышли из команды',
        run: () => leaveTeam(team.id),
        after: leavePage,
      }),
    };
  };

  return { memberActionsFor, selfAction: selfActionOf(), confirmProps };
};

export default useTeamManagement;
