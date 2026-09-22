import { Navigate } from 'react-router-dom';
import LoginForm from "./components/login-form/LoginForm"
import Registration from './pages/RegistrationPage';
import TeamsPage from './pages/TeamsPage';
import StudentProfilePage from "./pages/StudentProfile";
import CabinetPage from './pages/CabinetPage';
import MyProfilePage from './pages/MyProfilePage';
import AdminLayout from './pages/AdminLayout';
import AdminOverviewPage from './pages/AdminOverviewPage';
import AdminBoardPage from './pages/AdminBoardPage';
import AdminPeoplePage from './pages/AdminPeoplePage';
import AdminAccessPage from './pages/AdminAccessPage';
import AdminHistoryPage from './pages/AdminHistoryPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import TeamProfilePage from './pages/TeamProfilePage';
import StudentsPage from './pages/StudentsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import JoinPage from './pages/JoinPage';
import HowItWorksPage from './pages/HowItWorksPage';
import { RequireAdmin, RequireParticipant } from './components/route-guards/RouteGuards';

const routes = [
  // No page lives at "/" and there's no client-side auth guard; send the bare domain and any
  // unknown path to /login. Authenticated users are unaffected in the normal flow — the backend
  // redirects them straight to /teams after login (SimpleAuthenticationSuccessHandler).
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <LoginForm />
  },
  {
    path: '/registration',
    element: <Registration />
  },
  {
    // Unguarded like /registration: the page itself leads a signed-out person to login and one
    // without a questionnaire to the questionnaire, and back.
    path: '/join/:token',
    element: <JoinPage />
  },
  {
    path: '/teams',
    element: <RequireParticipant><TeamsPage /></RequireParticipant>
  },
  {
    // The questionnaire, reached from the account menu (#64). Unguarded like /profile: an account
    // without a questionnaire is told so here rather than bounced.
    path: '/me',
    element: <MyProfilePage />
  },
  {
    // Deliberately unguarded: this is where an account without a questionnaire is sent, and the
    // page itself explains that state and links to the form.
    path: '/profile',
    element: <CabinetPage />
  },
  {
    // Unguarded on purpose, like /profile: the shell offers this page to an account that has not
    // filled the questionnaire yet, which is exactly who needs it, and RequireParticipant would
    // bounce them off it.
    path: '/how-it-works',
    element: <HowItWorksPage />
  },
  {
    path: '/applications',
    element: <RequireParticipant><ApplicationsPage /></RequireParticipant>
  },
  {
    // The area is a layout with one section so far: #47-#49 add siblings to `children` and
    // inherit the frame — the selection's name, the hand-over banner — instead of repeating it.
    path: '/admin',
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    children: [
      { index: true, element: <AdminOverviewPage /> },
      { path: 'board', element: <AdminBoardPage /> },
      { path: 'people', element: <AdminPeoplePage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'access', element: <AdminAccessPage /> },
      { path: 'history', element: <AdminHistoryPage /> },
    ]
  },
  {
    path: '/teams/:teamId',
    element: <RequireParticipant><TeamProfilePage /></RequireParticipant>
  },
  {
    path: '/students/:studentId',
    element: <RequireParticipant><StudentProfilePage /></RequireParticipant>
  },
  {
    path: '/students',
    element: <RequireParticipant><StudentsPage /></RequireParticipant>
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  },
];

export default routes;
