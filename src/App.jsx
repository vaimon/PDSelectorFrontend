import './styles/style.css';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import routes from './routes';
import IdentityProvider from './context/IdentityProvider';
import NotificationProvider from './context/NotificationProvider';
import ApplicationsProvider from './context/ApplicationsProvider';
import PendingJoinRedirect from './components/route-guards/PendingJoinRedirect';
function App() {
  return (
    <NotificationProvider>
      <IdentityProvider>
        <div className="App">
          <Router>
            {/* Inside the router: the counter refreshes on every navigation. */}
            <ApplicationsProvider>
              <PendingJoinRedirect />
              <Routes>
                {routes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element}>
                    {/* An area with sections is one route with children: the parent draws the
                        frame and <Outlet/> draws whichever section is open. */}
                    {route.children?.map((child, childIndex) => (
                      <Route
                        key={childIndex}
                        index={child.index}
                        path={child.path}
                        element={child.element}
                      />
                    ))}
                  </Route>
                ))}
              </Routes>
            </ApplicationsProvider>
          </Router>
        </div>
      </IdentityProvider>
    </NotificationProvider>
  );
}
export default App;
