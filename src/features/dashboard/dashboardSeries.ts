
import type { Expense, Receipt } from '../../domain/models';

export type DashboardPeriod = 'week' | 'month' | 'year';

export interface DashboardBucket {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
}

export interface DashboardSeries {
  buckets: DashboardBucket[];
  startDate: string;
  endDate: string;
  revenue: number;
  expenses: number;
  maxValue: number;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function monthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

/**
 * Interpreta YYYY-MM-DD usando o calendário local.
 * Evita deslocamentos de data causados pela conversão UTC.
 */
function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day, 12);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function monthLabel(monthIndex: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })
    .format(new Date(2024, monthIndex, 1, 12))
    .replace('.', '');
}

function weekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
  })
    .format(date)
    .replace('.', '');
}

/**
 * Semana: últimos 7 dias, incluindo hoje.
 * Mês: todos os dias do mês atual.
 * Ano: janeiro até dezembro do ano atual.
 *
 * Valores monetários são armazenados em centavos.
 */
export function buildDashboardSeries(
  receipts: Receipt[],
  expenses: Expense[],
  period: DashboardPeriod,
  now: Date = new Date(),
): DashboardSeries {
  const year = now.getFullYear();
  const month = now.getMonth();

  const buckets: DashboardBucket[] = [];

  if (period === 'year') {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      buckets.push({
        key: monthKey(year, monthIndex + 1),
        label: monthLabel(monthIndex),
        revenue: 0,
        expenses: 0,
      });
    }
  } else if (period === 'month') {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      buckets.push({
        key: dateKey(year, month + 1, day),
        label: String(day),
        revenue: 0,
        expenses: 0,
      });
    }
  } else {
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(
        year,
        month,
        now.getDate() - offset,
        12,
      );

      buckets.push({
        key: dateKey(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate(),
        ),
        label: weekdayLabel(date),
        revenue: 0,
        expenses: 0,
      });
    }
  }

  const bucketMap = new Map(
    buckets.map((bucket) => [bucket.key, bucket]),
  );

  const groupByMonth = period === 'year';

  // Entradas: somente recibos finalizados.
  for (const receipt of receipts) {
    if (receipt.status !== 'FINALIZADO') continue;

    const parsed = parseDateKey(receipt.paymentDate);

    if (!parsed) continue;

    const key = groupByMonth
      ? monthKey(parsed.year, parsed.month)
      : dateKey(parsed.year, parsed.month, parsed.day);

    const bucket = bucketMap.get(key);

    if (bucket && Number.isFinite(receipt.amount)) {
      bucket.revenue += receipt.amount;
    }
  }

  // Saídas: despesas registradas.
  for (const expense of expenses) {
    const parsed = parseDateKey(expense.date);

    if (!parsed) continue;

    const key = groupByMonth
      ? monthKey(parsed.year, parsed.month)
      : dateKey(parsed.year, parsed.month, parsed.day);

    const bucket = bucketMap.get(key);

    if (bucket && Number.isFinite(expense.amount)) {
      bucket.expenses += expense.amount;
    }
  }

  const revenue = buckets.reduce(
    (sum, bucket) => sum + bucket.revenue,
    0,
  );

  const totalExpenses = buckets.reduce(
    (sum, bucket) => sum + bucket.expenses,
    0,
  );

  const maxValue = buckets.reduce(
    (maximum, bucket) =>
      Math.max(maximum, bucket.revenue, bucket.expenses),
    0,
  );

  return {
    buckets,
    startDate: buckets[0]?.key ?? '',
    endDate: buckets[buckets.length - 1]?.key ?? '',
    revenue,
    expenses: totalExpenses,
    maxValue,
  };
}
