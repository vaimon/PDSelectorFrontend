import Modal from "../forms/modal/Modal";
import { courseLabel } from "../../utils/board";
import "./style.css";

/**
 * Who leads the team once its lead is moved out. The server hands the lead over before it moves
 * anybody (a team never stays without one), so the choice is among the members who stay.
 */
const LeadPicker = ({ team, leaving, onPick, onCancel }) => {
  const staying = team.members.filter((member) => member.id !== leaving.id);

  return (
    <Modal show onClose={onCancel}>
      <div className="board-dialog">
        <h2 className="board-dialog-title">Кто поведёт команду «{team.name}»?</h2>
        <p className="board-dialog-note">
          {leaving.name} — тимлид. Прежде чем уйти из команды, роль переходит к одному из тех, кто остаётся.
        </p>
        <ul className="board-destinations">
          {staying.map((member) => (
            <li key={member.id}>
              <button type="button" className="board-destination" onClick={() => onPick(member.id)}>
                <span className="board-destination-name">{member.name}</span>
                <span className="board-destination-meta">
                  {courseLabel(member.course)}{member.group ? `, группа ${member.group}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default LeadPicker;
