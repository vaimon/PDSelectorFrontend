import ReactDOM from 'react-dom';

const SuccessMessage = ({ message }) => {
  return ReactDOM.createPortal(
    <div className="success-message" role="status" aria-live="polite">
      {message}
    </div>,
    document.body 
  );
};

export default SuccessMessage;
