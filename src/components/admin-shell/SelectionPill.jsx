import { useIdentity } from '../../context/identityContext';
import useHandOver from '../../hooks/useHandOver';
import { describeSelectionWindow } from '../../utils/selectionWindow';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole days from today to the last day of the window, counting the last day itself as open.
 * Only asked while the backend says the window is open, so a missing date means «no count», not 0.
 */
const daysLeft = (endDate) => {
  if (!Array.isArray(endDate) || endDate.length < 3) return null;
  const end = new Date(endDate[0], endDate[1] - 1, endDate[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end - today) / DAY_MS);
};

const describe = (activeTrack, handOver) => {
  const selection = describeSelectionWindow(activeTrack);
  if (!selection) {
    return { state: 'none', name: 'Набора нет', note: null, short: 'нет набора' };
  }

  // Checked before the window: once handed over, «идёт до …» would tell the reader something untrue.
  if (handOver.handedOver) {
    return {
      state: 'handed-over',
      name: selection.name,
      note: `передан в кабинет ПД ${handOver.date} · только просмотр`,
      short: 'передан',
      title: handOver.note,
    };
  }

  if (selection.state === 'open') {
    const days = daysLeft(activeTrack.endDate);
    const count = days == null ? '' : days === 0 ? ' · последний день' : ` · ${days} дн.`;
    return {
      state: 'open',
      name: selection.name,
      note: `идёт ${selection.note}${count}`,
      short: days == null ? 'идёт' : days === 0 ? 'последний день' : `ещё ${days} дн.`,
    };
  }

  if (selection.state === 'upcoming') {
    return { state: 'upcoming', name: selection.name, note: `не открыт · ${selection.note}`, short: 'не открыт' };
  }

  return { state: 'closed', name: selection.name, note: `${selection.note} · не передан`, short: 'закрыт' };
};

/**
 * The one place the admin area says which selection this is and where it stands (#68). It
 * replaces the window sentence and the hand-over banner the frame used to print on every page.
 *
 * Not `role="status"`: nothing here is announced as it changes, and the app's toasts own that role.
 */
const SelectionPill = () => {
  const { activeTrack } = useIdentity();
  const handOver = useHandOver();
  const { state, name, note, short, title } = describe(activeTrack, handOver);

  // The short form stands in for the name and the sentence on a phone, where the bar has room
  // for a word or two; the full sentence stays in the title. Only one of the two is ever displayed,
  // so a screen reader hears whichever the reader sees.
  return (
    <p className={`selection-pill selection-pill--${state}`} title={title ?? (note ? `${name}: ${note}` : name)}>
      <span className="selection-pill-dot" aria-hidden="true" />
      <span className="selection-pill-name">{name}</span>
      {note && <span className="selection-pill-note">{note}</span>}
      <span className="selection-pill-short">{short}</span>
    </p>
  );
};

export default SelectionPill;
