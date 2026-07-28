import type { Timestamp } from 'firebase/firestore';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
});

const jakartaDatePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getJakartaDateParts(date: Date): { year: string; month: string; day: string } {
  const values = Object.fromEntries(
    jakartaDatePartsFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  if (!values.year || !values.month || !values.day) {
    throw new Error('Tanggal Jakarta tidak dapat dihitung.');
  }
  return { year: values.year, month: values.month, day: values.day };
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDateTime(value?: Timestamp | Date | null): string {
  if (!value) return '-';
  const date = value instanceof Date ? value : value.toDate();
  return dateTimeFormatter.format(date);
}

export function getJakartaDateKey(date = new Date()): string {
  const { year, month, day } = getJakartaDateParts(date);
  return `${year}${month}${day}`;
}

export function toDateInputValue(date: Date): string {
  const { year, month, day } = getJakartaDateParts(date);
  return `${year}-${month}-${day}`;
}

export function getJakartaMonthStartInputValue(date = new Date()): string {
  const { year, month } = getJakartaDateParts(date);
  return `${year}-${month}-01`;
}

export function parseJakartaDateInput(value: string, endOfDay: boolean): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Format tanggal tidak valid.');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMilliseconds = endOfDay
    ? Date.UTC(year, month - 1, day, 16, 59, 59, 999)
    : Date.UTC(year, month - 1, day, -7, 0, 0, 0);
  const result = new Date(utcMilliseconds);

  if (toDateInputValue(result) !== value) {
    throw new Error('Tanggal kalender tidak valid.');
  }
  return result;
}
