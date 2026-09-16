import ReactDOM from 'react-dom';

import './style.css';

const NotificationStrip = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="notification-strip" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <span className="notification-text">{notification.text}</span>
          <button
            type="button"
            className="notification-dismiss"
            onClick={() => onDismiss(notification.id)}
            aria-label="Закрыть сообщение"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
};

export default NotificationStrip;
