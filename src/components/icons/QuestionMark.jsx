/**
 * «?» in a circle for the guidance link (#61).
 *
 * Drawn here rather than taken from an icon set: the sets either fill the circle or stroke it at
 * 2px, and next to the 1px borders of the bar's own controls both read as a heavier element than
 * the items around them. The stroke follows the design system's hairline weight instead.
 */
const QuestionMark = ({ size = 22 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10.25" />
    <path d="M9.1 9.2a3 3 0 1 1 4.25 2.85c-.85.42-1.35 1.05-1.35 1.9v.45" />
    <circle cx="12" cy="17.6" r="0.85" fill="currentColor" stroke="none" />
  </svg>
);

export default QuestionMark;
