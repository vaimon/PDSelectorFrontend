import { Navigate } from 'react-router-dom';
import LoginForm from "./components/login-form/LoginForm"
import Registration from './pages/RegistrationPage';
import TeamsPage from './pages/TeamsPage';
import StudentProfilePage from "./pages/StudentProfile";
import AdminPage from './pages/AdminPage';
import TeamProfilePage from './pages/TeamProfilePage';
import StudentsPage from './pages/StudentsPage';
import AuthPage from './pages/AuthPage';

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
    path: '/teams',
    element: <TeamsPage />
  },
  {
    path: '/profile',
    element: <StudentProfilePage />
  },
  {
    path: '/admin',
    element: <AdminPage />
  },
  {
    path: '/teams/:teamId',
    element: <TeamProfilePage />
  },
  {
    path: '/students/:studentId',
    element: <StudentProfilePage />
  },
  {
    path: '/students',
    element: <StudentsPage />
  },
  {
    path: '/auth',
    element: <AuthPage />
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  },
];

export default routes;
