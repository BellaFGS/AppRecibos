import { describe, expect, it } from 'vitest';
import { calculatePricing } from './financial';

describe('regras de formação de preço', () => {
  it('calcula acréscimo (markup) sobre o custo', () => {
    const result = calculatePricing(10_000, 30, 'markup');
    expect(result.suggestedPrice).toBe(13_000);
    expect(result.finalPrice).toBe(13_000);
    expect(result.profit).toBe(3_000);
    expect(result.actualMargin).toBeCloseTo(23.076923, 5);
  });

  it('calcula preço a partir da margem desejada sobre a venda', () => {
    expect(calculatePricing(10_000, 25, 'margin').suggestedPrice).toBe(13_333);
  });

  it('prioriza preço final manual e calcula lucro real', () => {
    const result = calculatePricing(10_000, 30, 'markup', 15_000);
    expect(result.suggestedPrice).toBe(13_000);
    expect(result.finalPrice).toBe(15_000);
    expect(result.profit).toBe(5_000);
    expect(result.actualMargin).toBeCloseTo(33.3333, 3);
  });

  it('representa prejuízo quando o preço final fica abaixo do custo', () => {
    expect(calculatePricing(10_000, 30, 'markup', 8_000).profit).toBe(-2_000);
  });

  it('trata custo zero e rejeita entradas inválidas', () => {
    expect(calculatePricing(0, 30, 'markup').suggestedPrice).toBe(0);
    expect(() => calculatePricing(-1, 30, 'markup')).toThrow(RangeError);
    expect(() => calculatePricing(100, -1, 'markup')).toThrow(RangeError);
  });
});
