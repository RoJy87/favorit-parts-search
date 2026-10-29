import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AnaloguesTable from './components/AnaloguesTable.jsx';
import BrandsTable from './components/BrandsTable.jsx';
import SearchForm from './components/SearchForm.jsx';
import { clearSelection, loadAnalogues } from './store/partsSlice.js';

export default function App() {
  const dispatch = useDispatch();
  const { selection, brandsNumber } = useSelector((state) => state.parts);
  const pendingOffers = useRef(null);

  const openBrand = (item) => {
    pendingOffers.current?.abort();
    pendingOffers.current = dispatch(loadAnalogues({ item, number: brandsNumber }));
  };

  const backToBrands = () => {
    pendingOffers.current?.abort();
    dispatch(clearSelection());
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand mb-0 h1">Проценка автозапчастей</span>
          <span className="navbar-text small text-white-50 d-none d-sm-inline">
            поиск аналогов и предложений складов
          </span>
        </div>
      </nav>

      <main className="container py-4 flex-grow-1">
        <SearchForm />
        {selection ? (
          <AnaloguesTable onBack={backToBrands} onRetry={() => openBrand(selection)} />
        ) : (
          <BrandsTable onSelect={openBrand} />
        )}
      </main>

      <footer className="border-top py-3">
        <div className="container text-secondary small">
          Данные: Web-сервис «Проценка» Favorit Parts. Цены и остатки — на момент запроса.
        </div>
      </footer>
    </div>
  );
}
