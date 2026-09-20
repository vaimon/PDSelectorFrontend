import "./style.css"
import { Link } from "react-router-dom";

/**
 * One card for the two things this app lists: a team and a person.
 *
 * It is as tall as what is in it — nothing is reserved for text that may not be there — and its
 * actions sit at the bottom, so a row of cards ends on one line. The variant is passed in rather
 * than guessed from the fields: a person card that happened to have no project type used to get
 * different metrics by accident, which every page then had to undo.
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
  actions = [],
}) => {
  const tagNames = tags.map((tag) => (typeof tag === 'string' ? tag : tag.name));
  const showApplyAction = Boolean(showApplyButton && onApply);
  const showViewAction = Boolean(profileLink);
  const hasActions = showApplyAction || showViewAction || actions.length > 0;
  // Same rule as the apply button: a disabled action has to say why in text, because a phone has
  // no hover and a disabled button is not reachable with a keyboard or a screen reader.
  // Two actions off for the same reason — the closed window — say it once.
  const reasons = [...new Set([
    ...(showApplyAction && applyDisabled && applyReason ? [applyReason] : []),
    ...actions.filter((action) => action.disabled && action.reason).map((action) => action.reason),
  ])];

  return (
    <div className={`card card--${variant}`}>
      <div className="card-header">
        <h3 className="card-name" title={name}>{name}</h3>
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
      {hasActions && (
        <div className="card-actions">
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
          {showViewAction && (
            <Link to={profileLink} className="action-button view action-link">Перейти</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Card;
