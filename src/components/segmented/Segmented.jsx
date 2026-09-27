import "./Segmented.css";

/**
 * Two or three views of one list (#78): a track with the chosen one raised on it. A group of toggle
 * buttons, not tabs — the list under it stays the same list, only ordered or cut another way.
 */
const Segmented = ({ label, options, value, onChange }) => (
  <div className="segmented" role="group" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default Segmented;
