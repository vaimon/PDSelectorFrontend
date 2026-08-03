import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Ошибка рендера приложения:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="status-page" role="alert">
          <h1>Не удалось открыть страницу</h1>
          <p>Обновите данные страницы или вернитесь к авторизации.</p>
          <div className="status-page-actions">
            <button type="button" onClick={() => window.location.reload()}>
              Обновить
            </button>
            <button type="button" onClick={() => window.location.assign('/login')}>
              Перейти ко входу
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
