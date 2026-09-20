import { useIdentity } from '../context/identityContext';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

/**
 * Whether the current selection has been handed over to the ПД cabinet.
 *
 * After the hand-over the backend refuses every change to the selection and to its teams
 * (`assertNotHandedOver`, checked before the window and before the admin shortcut), so the admin
 * area is a read-only record of what was. Every section of it needs the same answer, which is why
 * this is one hook rather than each screen reading the track its own way.
 *
 * `handedOverAt` is an ISO string — the one date in `TrackDto` that is not a `[year, month, day]`
 * array, because the field is new and no client depended on the array shape.
 */
export const useHandOver = () => {
  const { activeTrack } = useIdentity();
  const handedOverAt = activeTrack?.handedOverAt ?? null;

  if (!handedOverAt) {
    return { handedOver: false, note: null };
  }

  const on = new Date(handedOverAt);
  return {
    handedOver: true,
    note: `Набор «${activeTrack.name}» передан в кабинет ПД ${dateFormatter.format(on)}: составы больше не меняются здесь.`,
  };
};

export default useHandOver;
