
import { describe, expect, it } from 'vitest';
import type { Expense, Receipt } from '../../domain/models';
import { buildDashboardSeries } from './dashboardSeries';

const receipt = (
  id: string,
  paymentDate: string,
  amount: number,
  status = 'FINALIZADO',
) => ({
  id,
  paymentDate,
  amount,
  status,
}) as Receipt;

const expense = (
  id: string,
  date: string,
  amount: number,
) => ({
  id,
  date,
  amount,
}) as Expense;

describe('buildDashboardSeries', () => {
  const now = new Date(2026, 10, 6, 12);

  it('agrupa receitas e despesas por dia na semana', () => {
    const result = buildDashboardSeries(
      [
        receipt('r1', '2026-11-01', 12000),
        receipt('r2', '2026-11-06', 8000),
        receipt('r3', '2026-11-06', 2000),
      ],
      [
        expense('e1', '2026-11-04', 3500),
        expense('e2', '2026-11-06', 1500),
      ],
      'week',
      now,
    );

    expect(result.buckets).toHaveLength(7);
    expect(result.startDate).toBe('2026-10-31');
    expect(result.endDate).toBe('2026-11-06');

    expect(
      result.buckets.find(
        (bucket) => bucket.key === '2026-11-06',
      ),
    ).toMatchObject({
      revenue: 10000,
      expenses: 1500,
    });

    expect(result.revenue).toBe(22000);
    expect(result.expenses).toBe(5000);
  });

  it('respeita os limites do mês', () => {
    const result = buildDashboardSeries(
      [
        receipt('before', '2026-10-31', 9000),
        receipt('first', '2026-11-01', 1000),
        receipt('last', '2026-11-30', 2000),
        receipt('after', '2026-12-01', 7000),
      ],
      [
        expense('e1', '2026-11-15', 500),
      ],
      'month',
      now,
    );

    expect(result.buckets).toHaveLength(30);
    expect(result.startDate).toBe('2026-11-01');
    expect(result.endDate).toBe('2026-11-30');

    expect(result.revenue).toBe(3000);
    expect(result.expenses).toBe(500);
  });

  it('agrupa as movimentações por mês no ano selecionado', () => {
    const result = buildDashboardSeries(
      [
        receipt('previous', '2025-12-31', 5000),
        receipt('january', '2026-01-15', 10000),
        receipt('november', '2026-11-06', 2500),
        receipt('next', '2027-01-01', 9000),
      ],
      [
        expense('e1', '2026-01-20', 3000),
        expense('e2', '2026-11-06', 1000),
      ],
      'year',
      now,
    );

    expect(result.buckets).toHaveLength(12);
    expect(result.startDate).toBe('2026-01');
    expect(result.endDate).toBe('2026-12');

    expect(result.buckets[0]).toMatchObject({
      revenue: 10000,
      expenses: 3000,
    });

    expect(result.buckets[10]).toMatchObject({
      revenue: 2500,
      expenses: 1000,
    });

    expect(result.buckets[1].revenue).toBe(0);
    expect(result.revenue).toBe(12500);
    expect(result.expenses).toBe(4000);
  });

  it('ignora recibos que não estejam finalizados', () => {
    const result = buildDashboardSeries(
      [
        receipt('draft', '2026-11-06', 50000, 'RASCUNHO'),
      ],
      [],
      'week',
      now,
    );

    expect(result.revenue).toBe(0);
    expect(result.maxValue).toBe(0);
  });

  it('mantém períodos sem movimentações zerados', () => {
    const result = buildDashboardSeries(
      [],
      [],
      'month',
      now,
    );

    expect(result.buckets).toHaveLength(30);

    expect(
      result.buckets.every(
        (bucket) =>
          bucket.revenue === 0 &&
          bucket.expenses === 0,
      ),
    ).toBe(true);

    expect(result.revenue).toBe(0);
    expect(result.expenses).toBe(0);
    expect(result.maxValue).toBe(0);
  });

  it('ignora datas inválidas e valores não numéricos', () => {
    const result = buildDashboardSeries(
      [
        receipt('invalid-date', '2026-02-30', 1000),
        receipt('invalid-amount', '2026-11-06', Number.NaN),
      ],
      [],
      'week',
      now,
    );

    expect(result.revenue).toBe(0);
  });

  it('considera 29 dias em fevereiro de ano bissexto', () => {
    const result = buildDashboardSeries(
      [],
      [],
      'month',
      new Date(2024, 1, 15, 12),
    );

    expect(result.buckets).toHaveLength(29);
    expect(result.startDate).toBe('2024-02-01');
    expect(result.endDate).toBe('2024-02-29');
  });
});
