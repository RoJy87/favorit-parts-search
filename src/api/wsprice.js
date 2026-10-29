const API_URL = import.meta.env.VITE_WSPRICE_URL || 'https://api.favorit-parts.ru/hs/hsprice/';
const API_KEY = import.meta.env.VITE_WSPRICE_KEY || '00000000-0000-0000-0000-000000000001';

const EMPTY_GOODS_ID = '00000000-0000-0000-0000-000000000000';

const ERROR_TEXT = {
  'Empty key!': 'Не задан ключ покупателя. Укажите VITE_WSPRICE_KEY в .env.',
  'Invalid key client!': 'Сервис не нашёл клиента с таким ключом.',
  'Empty number goods!': 'Не указан номер детали.',
  'Request quota exceeded!': 'Превышен лимит запросов к сервису. Подождите и повторите поиск.',
};

function toMessage(raw) {
  const known = ERROR_TEXT[raw];
  return known ? `${known} (${raw})` : raw;
}

function isFound(goods) {
  return Boolean(goods && goods.brand && goods.goodsID && goods.goodsID !== EMPTY_GOODS_ID);
}

function minOfferPrice(warehouses) {
  const prices = warehouses
    .map((warehouse) => Number(warehouse.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length ? Math.min(...prices) : null;
}

function normalizeGoods(goods) {
  const warehouses = Array.isArray(goods.warehouses) ? goods.warehouses : [];

  return {
    id: goods.goodsID,
    brand: goods.brand,
    name: goods.name,
    number: goods.number,
    count: Number(goods.count) || 0,
    notRefund: Boolean(goods.notRefund),
    warehouses: warehouses.map((warehouse) => ({
      id: warehouse.id,
      code: warehouse.code || 'Склад',
      own: Boolean(warehouse.own),
      price: Number(warehouse.price) || 0,
      stock: Number(warehouse.stock) || 0,
      shipmentDate: warehouse.shipmentDate,
      notRefund: Boolean(warehouse.notRefund),
    })),
    // goods.price оставлен в API для совместимости и приходит нулевым/устаревшим:
    // стоимость позиции берётся из предложений складов.
    price: minOfferPrice(warehouses),
  };
}

async function request({ number, brand, analogues, signal }) {
  const url = new URL(API_URL);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('number', number);
  url.searchParams.set('info', 'on');

  if (brand) {
    url.searchParams.set('brand', brand);
  }
  if (analogues) {
    url.searchParams.set('analogues', 'on');
  }

  let response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error('Не удалось связаться с сервисом. Проверьте подключение к сети.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // Бизнес-ошибки приходят с HTTP 403 и телом {"error": "..."}:
  // статус ответа без разбора тела не различает «неверный ключ» и «нет квоты».
  if (payload && payload.error) {
    throw new Error(toMessage(payload.error));
  }
  if (!response.ok) {
    throw new Error(`Сервис недоступен (HTTP ${response.status}).`);
  }
  if (!payload || !Array.isArray(payload.goods)) {
    throw new Error('Неожиданный формат ответа сервиса.');
  }

  // «Деталь не найдена» приходит массивом с одной пустой структурой.
  return payload.goods.filter(isFound);
}

export async function fetchBrands(number, signal) {
  const goods = await request({ number, signal });
  return goods.map(normalizeGoods);
}

export async function fetchAnalogues({ number, brand }, signal) {
  const goods = await request({ number, brand, analogues: true, signal });
  const [base] = goods;

  if (!base) {
    return { base: null, analogues: [] };
  }

  const analogues = Array.isArray(base.analogues) ? base.analogues.filter(isFound) : [];

  return { base: normalizeGoods(base), analogues: analogues.map(normalizeGoods) };
}
