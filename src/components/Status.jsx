export function Loader({ text = 'Загружаем данные…' }) {
  return (
    <div className="status-block text-secondary" role="status">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      {text}
    </div>
  );
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex flex-wrap align-items-center gap-3" role="alert">
      <span className="flex-grow-1">{message}</span>
      {onRetry ? (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Повторить
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="alert alert-light border text-secondary mb-0">{text}</div>;
}
