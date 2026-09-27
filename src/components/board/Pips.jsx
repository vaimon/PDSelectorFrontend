import "./actions.css";

/**
 * One year of one team as places: filled, open, and any taken over the target. Drawn for the eye
 * only — `CourseSlots` around it says the same numbers in words.
 */
const Pips = ({ have, target }) => (
  <span className="pips" aria-hidden="true">
    {Array.from({ length: Math.max(have, target) }, (_, index) => (
      <span
        key={index}
        className={`pip${index >= have ? " is-open" : index >= target ? " is-over" : ""}`}
      />
    ))}
  </span>
);

export default Pips;
