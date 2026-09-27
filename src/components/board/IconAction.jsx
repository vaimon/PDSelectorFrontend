import { forwardRef } from "react";

import "./actions.css";

/**
 * An action drawn as an icon (#72). The icon alone says little, so it always carries a label: as the
 * accessible name, naming what it acts on («Переместить в команду: Иванов Иван»), and as a tooltip
 * that shows on hover and on keyboard focus alike — a `title` would leave the keyboard out.
 */
const IconAction = forwardRef(({ label, tip, className = "", children, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    className={`icon-action ${className}`.trim()}
    aria-label={label}
    data-tip={tip ?? label}
    {...rest}
  >
    {children}
  </button>
));

IconAction.displayName = "IconAction";

export default IconAction;
