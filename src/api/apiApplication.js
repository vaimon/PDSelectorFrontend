import apiClient from './apiClient';

/**
 * A status change sends the whole record back: `PUT /applications` takes an ApplicationCreationDto
 * where id, student_id, team_id, status and type are all required. Every row on screen already
 * carries them, so nothing has to be fetched first.
 */
const changeStatus = async (application, status) => {
  const response = await apiClient.put('/applications', {
    id: application.id,
    student_id: application.student.id,
    team_id: application.team.id,
    type: application.type,
    status,
  });
  return response.data;
};

// A student asking to join a team. The type is required since vaimon/team-selection#8.
export const sendRequest = async (studentId, teamId) => {
  const response = await apiClient.post('/applications', {
    student_id: studentId,
    team_id: teamId,
    status: 'SENT',
    type: 'REQUEST',
  });
  return response.data;
};

// Only the sender, and only while the application is still `SENT`.
export const cancelApplication = (application) => changeStatus(application, 'CANCELLED');

// Only the addressee, and only while the application is still `SENT`.
export const acceptApplication = (application) => changeStatus(application, 'ACCEPTED');
export const rejectApplication = (application) => changeStatus(application, 'REJECTED');

/**
 * Reviving a rejected or cancelled application. `POST /applications` refuses when a row for this
 * team and student already exists, so a second attempt is a resend by the sender, not a new one.
 */
export const resendApplication = (application) => changeStatus(application, 'SENT');
