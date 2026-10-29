import { Fragment, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatCount, formatDateTime, formatMoney } from '../utils/format.js';
import { EmptyState, ErrorAlert, Loader } from './Status.jsx';

function WarehouseRows({ item }) {
  return (
    <tr className="warehouse-row">
      <td colSpan={7} className="bg-light">
        <table className="table table-sm mb-0 small">
          <thead>
            <tr className="text-secondary">
              <th scope="col">Склад</th>
              <th scope="col" className="text-end">Цена</th>
              <th scope="col" className="text-end">Остаток</th>
              <th scope="col" className="ps-3">Отгрузка</th>
              <th scope="col">Тип</th>
            </tr>
          </thead>
          <tbody>
            {item.warehouses
              .slice()
              .sort((left, right) => left.price - right.price)
              .map((warehouse) => (
                <tr key={`${warehouse.id}-${warehouse.shipmentDate}`}>
                  <td className="text-nowrap">{warehouse.code}</td>
                  <td className="text-end text-nowrap">{formatMoney(warehouse.price)}</td>
                  <td className="text-end text-nowrap">{formatCount(warehouse.stock)}</td>
                  <td className="ps-3 text-nowrap">{formatDateTime(warehouse.shipmentDate)}</td>
                  <td className="text-nowrap">
                    {warehouse.own ? (
                      <span className="badge text-bg-success">свой склад</span>
                    ) : (
                      <span className="badge text-bg-light text-secondary">поставщик</span>
                    )}
                    {warehouse.notRefund ? (
                      <span className="badge text-bg-warning ms-1">невозврат</span>
                    ) : null}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

export default function AnaloguesTable({ onBack, onRetry }) {
  const { selection, base, offersStatus, offers, offersError } = useSelector((state) => state.parts);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());

  const rows = useMemo(() => {
    const source = base ? [{ ...base, isBase: true }, ...offers] : offers;
    const filtered = inStockOnly ? source.filter((item) => item.count > 0) : source;

    return filtered.slice().sort((left, right) => {
      if (left.isBase !== right.isBase) {
        return left.isBase ? -1 : 1;
      }
      const leftStock = left.count > 0 ? 0 : 1;
      const rightStock = right.count > 0 ? 0 : 1;
      if (leftStock !== rightStock) {
        return leftStock - rightStock;
      }
      return (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY);
    });
  }, [base, offers, inStockOnly]);

  const inStockTotal = (base && base.count > 0 ? 1 : 0) + offers.filter((item) => item.count > 0).length;

  const toggle = (id) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="h5 mb-1">
            Аналоги и предложения
            {selection ? (
              <span className="text-secondary fw-normal">
                {' '}
                — {selection.brand} {selection.number}
              </span>
            ) : null}
          </h2>
          {offersStatus === 'succeeded' ? (
            <div className="text-secondary small">
              Найдено аналогов: {offers.length}, в наличии: {inStockTotal}
            </div>
          ) : null}
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onBack}>
          ← Другой производитель
        </button>
      </div>

      {offersStatus === 'loading' ? <Loader text="Загружаем аналоги и предложения складов…" /> : null}
      {offersStatus === 'failed' ? <ErrorAlert message={offersError} onRetry={onRetry} /> : null}

      {offersStatus === 'succeeded' ? (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="in-stock-only"
                checked={inStockOnly}
                onChange={(event) => setInStockOnly(event.target.checked)}
              />
              <label className="form-check-label small" htmlFor="in-stock-only">
                Только в наличии
              </label>
            </div>
            <span className="text-secondary small">
              Позиций в таблице: {rows.length}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="card-body">
              <EmptyState
                text={
                  offers.length === 0
                    ? 'Аналогов по этой позиции сервис не вернул.'
                    : 'Нет позиций с ненулевым остатком. Снимите фильтр, чтобы увидеть все предложения.'
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="text-nowrap">Производитель</th>
                    <th scope="col">Наименование</th>
                    <th scope="col">Артикул</th>
                    <th scope="col" className="text-end">Стоимость</th>
                    <th scope="col" className="text-end">Остаток</th>
                    <th scope="col" className="text-end">Склады</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const isOpen = expanded.has(item.id);
                    return (
                      <Fragment key={item.id}>
                        <tr className={item.isBase ? 'table-primary' : undefined}>
                          <td className="fw-semibold text-nowrap">
                            {item.brand}
                            {item.isBase ? (
                              <span className="badge text-bg-primary ms-2">выбранная деталь</span>
                            ) : null}
                          </td>
                          <td>{item.name || '—'}</td>
                          <td className="text-nowrap">{item.number}</td>
                          <td className="text-end text-nowrap fw-semibold">{formatMoney(item.price)}</td>
                          <td className="text-end text-nowrap">
                            {item.count > 0 ? (
                              formatCount(item.count)
                            ) : (
                              <span className="badge text-bg-secondary">нет в наличии</span>
                            )}
                          </td>
                          <td className="text-end text-nowrap text-secondary small">
                            {item.warehouses.length > 0 ? `${item.warehouses.length} скл.` : '—'}
                          </td>
                          <td className="text-end">
                            <div className="d-inline-flex align-items-center gap-2 text-nowrap">
                              {item.notRefund ? <span className="badge text-bg-warning">невозврат</span> : null}
                              {item.warehouses.length > 0 ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link text-decoration-none p-0"
                                  onClick={() => toggle(item.id)}
                                  aria-expanded={isOpen}
                                >
                                  {isOpen ? 'Скрыть' : 'Склады'}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {isOpen ? <WarehouseRows item={item} /> : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
