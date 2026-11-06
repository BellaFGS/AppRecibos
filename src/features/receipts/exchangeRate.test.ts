import { describe, expect, it } from 'vitest';
import { convertUsdCentsToBrlCents } from './exchangeRate';

describe('USD to BRL conversion', () => {
  it('converts cents using the quote and rounds to a cent', () => {
    expect(convertUsdCentsToBrlCents(1000, 5.2)).toBe(5200);
    expect(convertUsdCentsToBrlCents(199, 5.1234)).toBe(1020);
  });
  it('rejects negative amounts and invalid quotes', () => {
    expect(() => convertUsdCentsToBrlCents(-1, 5)).toThrow(RangeError);
    expect(() => convertUsdCentsToBrlCents(100, 0)).toThrow(RangeError);
  });
});
