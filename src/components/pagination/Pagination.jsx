import './style.css';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Навигация по страницам">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
      >
        Назад
      </button>
      <span aria-live="polite">
        Страница {page + 1} из {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
      >
        Далее
      </button>
    </nav>
  );
};

export default Pagination;
