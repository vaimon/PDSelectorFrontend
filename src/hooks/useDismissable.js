import { useEffect, useRef } from 'react';

/**
 * Closes a dropdown on Escape and on a click outside it. Returns the ref to put on the element
 * that counts as «inside» — the button and its panel together, so a click on the button toggles
 * rather than closing and reopening.
 */
export const useDismissable = (isOpen, close) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const dismiss = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && ref.current?.contains(event.target)) return;
      close();
    };

    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, [isOpen, close]);

  return ref;
};

export default useDismissable;
