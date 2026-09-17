import Modal from '../forms/modal/Modal';
import './style.css';

const ConfirmDialog = ({
  request,
  onConfirm,
  onCancel,
  busy = false,
}) => {
  if (!request) {
    return null;
  }

  return (
    <Modal show onClose={busy ? () => {} : onCancel}>
      <div className="confirm-dialog">
        <h2 className="confirm-title">{request.heading}</h2>
        {request.description && <p className="confirm-description">{request.description}</p>}
        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-primary"
            onClick={onConfirm}
            disabled={busy}
          >
            {request.confirmText}
          </button>
          <button
            type="button"
            className="confirm-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Отмена
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
