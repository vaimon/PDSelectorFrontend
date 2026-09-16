import './styles/style.css';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import routes from './routes';
import { Provider } from 'react-redux';
import store from './store';
import IdentityProvider from './context/IdentityProvider';
import NotificationProvider from './context/NotificationProvider';
import ApplicationsProvider from './context/ApplicationsProvider';
function App() {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <IdentityProvider>
          <div className="App">
            <Router>
              {/* Inside the router: the counter refreshes on every navigation. */}
              <ApplicationsProvider>
                <Routes>
                  {routes.map((route, index) => (
                    <Route key={index} path={route.path} element={route.element} />
                  ))}
                </Routes>
              </ApplicationsProvider>
            </Router>
          </div>
        </IdentityProvider>
      </NotificationProvider>
    </Provider>
  );
}
export default App;
