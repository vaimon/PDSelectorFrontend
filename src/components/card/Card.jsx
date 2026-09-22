import "./style.css"
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

import { describeYears } from "../../utils/composition";

/**
 * One card for the two things this app lists: a team and a person.
 *
 * It is as tall as what is in it — nothing is reserved for text that may not be there — and its
 * actions sit at the bottom, so a row of cards ends on one line. The variant is passed in rather
 * than guessed from the fields: a person card that happened to have no project type used to get
 * different metrics by accident, which every page then had to undo.
 *
 * The way into the profile is the name itself (#59): a card carries one action button, and a second
 * button saying «Перейти» next to it made every card read as a choice between two things.
 */
const Card = ({
  name,
  type,
  resume,
  tags = [],
  profileLink,
  variant = "person",
  onApply,
  applyText = "Подать заявку",
  applyDisabled = false,
  applyReason,
  applyTone = "primary",
  showApplyButton,
  badge,
  note,
  composition,
  actions = [],
}) => {
  const tagNames = tags.map((tag) => (typeof tag === 'string' ? tag : tag.name));
  const showApplyAction = Boolean(showApplyButton && onApply);
  const years = composition ? describeYears(composition) : [];
  const hasActions = showApplyAction || years.length > 0 || actions.length > 0;
  // A disabled action says why in text, because a phone has no hover and a disabled button is not
  // reachable with a keyboard or a screen reader. On a wide screen the apply button is the
  // exception — the sentence behind it is its hover (#59) — so its reason is printed for phones only.
  const reasons = [...new Set(
    actions.filter((action) => action.disabled && action.reason).map((action) => action.reason),
  )];

  return (
    <div className={`card card--${variant}`}>
      <div className="card-header">
        <h3 className="card-name" title={name}>
          {profileLink ? (
            <Link to={profileLink} className="card-name-link">
              <span className="card-name-text">{name}</span>
              <FaChevronRight className="card-name-chevron" aria-hidden="true" />
            </Link>
          ) : name}
        </h3>
        {badge && <span className="card-badge">{badge}</span>}
        {type && (
          <p className="card-type">
            <span className="type-capture">Тип проекта: </span>
            {type}
          </p>
        )}
      </div>
      <div className="card-body">
        {resume && (
          <p className="card-resume" title={resume}>
            <span className="type-capture">Резюме: </span>
            {/* The text is capped, not the row: clamping the row itself would drop it out of flex
                and the label would lose the gap it shares with «Тип проекта». */}
            <span className="card-resume-text">{resume}</span>
          </p>
        )}
        {tagNames.length > 0 && (
          // The label sits above the chips, not in front of them: in front, a wrapped second row
          // started under the label instead of at the card's edge.
          <div className="card-technologies">
            <span className="text-capture">Технологии</span>
            <div className="card-tags">
              {tagNames.map((tag) => (
                <span key={tag} className="card-tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      {note && <p className="card-note">{note}</p>}
      {reasons.map((reason) => (
        <p className="card-action-reason" key={reason}>{reason}</p>
      ))}
      {showApplyAction && applyDisabled && applyReason && !reasons.includes(applyReason) && (
        <p className="card-action-reason card-action-reason--narrow">{applyReason}</p>
      )}
      {hasActions && (
        <div className="card-actions">
          {/* How full the team is, next to the button that fills it: a short row per year, so the
              numbers are read down the column instead of inside a sentence. */}
          {years.length > 0 && (
            <dl className="card-places">
              {years.map((year) => (
                <div className="card-place" key={year.label}>
                  <dt>{year.label}:</dt>
                  <dd>{year.taken}/{year.target}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="card-action-buttons">
            {actions.map((action) => (
              <button
                key={action.key ?? action.label}
                type="button"
                className={`action-button apply${action.tone === "cancel" ? " action-button--cancel" : ""}`}
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.reason}
              >
                {action.label}
              </button>
            ))}
            {showApplyAction && (
              <button
                type="button"
                className={`action-button apply${applyTone === "cancel" ? " action-button--cancel" : ""}`}
                onClick={onApply}
                disabled={applyDisabled}
                title={applyReason}
              >
                {applyText}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
