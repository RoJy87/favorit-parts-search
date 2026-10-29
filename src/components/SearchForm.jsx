import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MIN_QUERY_LENGTH, queryChanged, searchBrands } from '../store/partsSlice.js';

const DEBOUNCE_MS = 450;

export default function SearchForm() {
  const dispatch = useDispatch();
  const { query, brandsStatus } = useSelector((state) => state.parts);
  const pending = useRef(null);

  const value = query.trim();
  const tooShort = value.length > 0 && value.length < MIN_QUERY_LENGTH;

  // Поиск запускается по вводу, но с паузой и отменой предыдущего запроса:
  // у сервиса есть лимит запросов на клиента.
  useEffect(() => {
    if (value.length < MIN_QUERY_LENGTH) {
      return undefined;
    }

    const timer = setTimeout(() => {
      pending.current?.abort();
      pending.current = dispatch(searchBrands(value));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, dispatch]);

  const submit = (event) => {
    event.preventDefault();
    if (value.length < MIN_QUERY_LENGTH) {
      return;
    }
    pending.current?.abort();
    pending.current = dispatch(searchBrands(value));
  };

  return (
    <form className="card shadow-sm mb-4" onSubmit={submit}>
      <div className="card-body">
        <label className="form-label fw-semibold" htmlFor="article">
          Артикул детали
        </label>
        <div className="input-group input-group-lg">
          <input
            id="article"
            className={`form-control ${tooShort ? 'is-invalid' : ''}`}
            type="text"
            autoComplete="off"
            spellCheck="false"
            placeholder="Например: 01089"
            value={query}
            onChange={(event) => dispatch(queryChanged(event.target.value))}
          />
          <button className="btn btn-primary px-4" type="submit" disabled={value.length < MIN_QUERY_LENGTH}>
            {brandsStatus === 'loading' ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              'Найти'
            )}
          </button>
        </div>
        <div className="form-text">
          {tooShort
            ? `Введите минимум ${MIN_QUERY_LENGTH} символа номера детали.`
            : 'Поиск выполняется автоматически по мере ввода.'}
        </div>
      </div>
    </form>
  );
}
