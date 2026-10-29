const money = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const number = new Intl.NumberFormat('ru-RU');

export function formatMoney(value) {
  return value === null || value === undefined ? '—' : money.format(value);
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTime.format(date);
}

export function formatCount(value) {
  return number.format(value || 0);
}
