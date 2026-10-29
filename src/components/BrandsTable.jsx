import { useDispatch, useSelector } from 'react-redux';
import { searchBrands } from '../store/partsSlice.js';
import { formatCount, formatMoney } from '../utils/format.js';
import { EmptyState, ErrorAlert, Loader } from './Status.jsx';

export default function BrandsTable({ onSelect }) {
  const dispatch = useDispatch();
  const { query, brandsStatus, brands, brandsError, brandsNumber } = useSelector((state) => state.parts);

  if (brandsStatus === 'idle') {
    return (
      <div className="text-secondary small">
        Введите артикул — сервис покажет производителей, у которых есть эта деталь.
      </div>
    );
  }

  if (brandsStatus === 'loading') {
    return <Loader text="Ищем производителей по артикулу…" />;
  }

  if (brandsStatus === 'failed') {
    return (
      <ErrorAlert
        message={brandsError}
        onRetry={() => dispatch(searchBrands(brandsNumber || query.trim()))}
      />
    );
  }

  if (brands.length === 0) {
    return <EmptyState text={`По артикулу «${brandsNumber}» ничего не найдено. Проверьте номер детали.`} />;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span className="fw-semibold">Производители: {brands.length}</span>
        <span className="text-secondary small">Артикул: {brandsNumber}</span>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">Производитель</th>
              <th scope="col">Наименование</th>
              <th scope="col">Артикул</th>
              <th scope="col" className="text-end">Цена от</th>
              <th scope="col" className="text-end">Остаток</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {brands.map((item) => (
              <tr
                key={item.id}
                className="brand-row"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(item);
                  }
                }}
              >
                <td className="fw-semibold text-nowrap">{item.brand}</td>
                <td>{item.name || '—'}</td>
                <td className="text-nowrap">{item.number}</td>
                <td className="text-end text-nowrap">{formatMoney(item.price)}</td>
                <td className="text-end text-nowrap">
                  {item.count > 0 ? (
                    formatCount(item.count)
                  ) : (
                    <span className="badge text-bg-secondary">нет в наличии</span>
                  )}
                </td>
                <td className="text-end">
                  <span className="btn btn-sm btn-outline-primary">Аналоги</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
