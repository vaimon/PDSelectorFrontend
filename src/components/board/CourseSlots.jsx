import Pips from "./Pips";
import "./actions.css";

const YEARS = [
  { label: "1 курс", have: "firstYears", target: "firstYearTarget" },
  { label: "2+ курс", have: "secondYears", target: "secondYearTarget" },
];

/**
 * A team's places by year (#78): the course and its pips, which are the whole picture for the eye.
 * The count is said in words once, to assistive tech, instead of again as text beside the dots.
 */
const CourseSlots = ({ team }) => (
  <span className="course-slots">
    {YEARS.map((year) => (
      <span
        key={year.label}
        className="course-slot"
        role="img"
        aria-label={`${year.label}: ${team[year.have]} из ${team[year.target]}`}
      >
        <span className="course-slot-label">{year.label}</span>
        <Pips have={team[year.have]} target={team[year.target]} />
      </span>
    ))}
  </span>
);

export default CourseSlots;
