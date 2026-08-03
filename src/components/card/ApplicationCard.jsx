import React, { useState } from "react";

const ApplicationCard = ({
    applicationId,
    studentName,
    teamName,
    teamId,
    studentId,
    teamDescription,
    technologies = [],
    status,
    onApprove,
    onReject,
    onCancel,
    onSending,
    onViewDetails,
    approveText = "Одобрить",
    rejectText = "Отклонить заявку",
    cancelText = "Отменить заявку",
    sendingText= "Подать заявку снова",
    viewDetailsText = "Подробнее",
    showCaptainOptions = false, 
  }) => {
    const [applicationStatus, setApplicationStatus] = useState(status);
  
    const handleApprove = () => {
      if (onApprove) onApprove(applicationId);
      setApplicationStatus("Accepted");
    };
  
    console.log('show>',showCaptainOptions);
    const handleReject = () => {
      if (onReject) onReject(applicationId);
      setApplicationStatus("Rejected");
    };
  
    const handleCancel = () => {
      if (onCancel) onCancel(applicationId);
      setApplicationStatus("Cancelled");
    };

    const handleSending = () =>{
        if (onSending) onSending(applicationId);
        setApplicationStatus("Sent");
    }
  
    const getStatusDetails = (status) => {
      switch (status) {
        case "Sent":
          return { text: "Отправлена", tone: "warn" };
        case "Accepted":
          return { text: "Принята", tone: "ok" };
        case "Rejected":
          return { text: "Отклонена", tone: "bad" };
        case "Cancelled":
          return { text: "Отменена", tone: "bad" };
        default:
          return { text: "Неизвестный", tone: "neutral" };
      }
    };
  
    const { text: statusText, tone: statusTone } = getStatusDetails(applicationStatus);
  
    return (
      <div className="card card--application">
        <div className="card-header">
          <h3 className="card-name" title={studentName}>{studentName}</h3>
          {teamName && (
            <p className="card-type">
              <span className="type-capture">Команда:</span>
              {teamName}
            </p>
          )}
        </div>
        <div className="card-body">
          {teamDescription && (
            <p className="card-resume" title={teamDescription}>
              <span className="type-capture">Описание команды:</span>
              {teamDescription}
            </p>
          )}
          <div className="card-tags">
            <span className="text-capture">Технологии:</span>
            {technologies.length > 0 ? (
              technologies.map((tech, index) => (
                <span key={index} className="card-tag">
                  {tech.name}
                </span>
              ))
            ) : (
              <p className="no-tags">-</p>
            )}
          </div>
          <p className={`status-badge status-${statusTone}`}>
            <strong>Статус: </strong>
            {statusText}
          </p>
        </div>
        <div className="card-actions">
          {applicationStatus === "Sent" && (
            <>
              {showCaptainOptions && (
                <button className="action-button approve" onClick={handleApprove}>
                  {approveText}
                </button>
              )}
              {showCaptainOptions ? (
                <button className="action-button reject" onClick={handleReject}>
                  {rejectText}
                </button>
              ) : (
                <button className="action-button cancel" onClick={handleCancel}>
                  {cancelText}
                </button>
              )}
            </>
          )}
          {
            applicationStatus==="Cancelled" &&(
                <>
                <button className="action-button apply" onClick={handleSending}>
                  {sendingText}
                </button>
                </>
            )
          }
          <a
            href={`/teams/${teamId}`}
            className="action-button view action-link"
            rel="noopener noreferrer"
          >
            Перейти к команде
          </a>
          <a
            href={`/students/${studentId}`}
            className="action-button view action-link"
            rel="noopener noreferrer"
          >
            Перейти к студенту
          </a>
        </div>
      </div>
    );
  };
  
  export default ApplicationCard;
