import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../design/fonts.js'
import '../design/theme.css'
import './styles/style.css'
import App from './App.jsx'
import { installAxiosAuthRedirect } from './api/authRedirect.js'
import ErrorBoundary from './components/error-boundary/ErrorBoundary.jsx'

const THEME_STORAGE_KEY = 'console-theme'
const isTheme = (value) => value === 'light' || value === 'dark'

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

    if (isTheme(savedTheme)) {
      return savedTheme
    }
  } catch {
    // Storage may be unavailable; the theme still works for the current page.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

document.documentElement.dataset.theme = getInitialTheme()
installAxiosAuthRedirect()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
