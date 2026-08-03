import "./style.css"
import { useEffect } from "react";

function Modal({ show, onClose, children }) {
  useEffect(() => {
    if (!show) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content" role="dialog" aria-modal="true">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть окно">
          &times;
        </button>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;

