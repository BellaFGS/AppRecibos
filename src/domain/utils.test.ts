import { describe, expect, it } from 'vitest';
import {
  compatible,
  parseMoney,
  proportionalCost,
  unitGroup,
} from './utils';
import type { CostItem } from './models';

describe('domain utilities', () => {
  it('converts Brazilian currency input to integer cents', () => {
    expect(parseMoney('R$ 1.234,56')).toBe(123456);
    expect(parseMoney('25,90')).toBe(2590);
    expect(parseMoney('')).toBe(0);
  });

  it('groups compatible measurement units', () => {
    expect(compatible('cm', 'm')).toBe(true);
    expect(compatible('g', 'kg')).toBe(true);
    expect(compatible('ml', 'L')).toBe(true);
    expect(compatible('cm', 'g')).toBe(false);
    expect(unitGroup('un')).toBe('count');
  });

  it('calculates proportional material cost in cents', () => {
    const item: CostItem = {
      id: 'item-1',
      name: 'Tecido',
      usedQuantity: 50,
      usedUnit: 'cm',
      referenceQuantity: 1,
      referenceUnit: 'm',
      referencePrice: 3000,
    };

    expect(proportionalCost(item)).toBe(1500);
  });

  it('returns zero when quantities are missing or units are incompatible', () => {
    const item: CostItem = {
      id: 'item-2',
      name: 'Material',
      usedQuantity: 10,
      usedUnit: 'cm',
      referenceQuantity: 1,
      referenceUnit: 'kg',
      referencePrice: 5000,
    };

    expect(proportionalCost(item)).toBe(0);
    expect(proportionalCost({ ...item, usedUnit: 'm', referenceUnit: 'cm', referenceQuantity: 0 })).toBe(0);
  });
});
