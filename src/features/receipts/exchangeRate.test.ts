import { describe, expect, it } from 'vitest';
import {
  convertUsdCentsToBrlCents,
  isExchangeRateCacheFresh,
  EXCHANGE_RATE_CACHE_TTL,
  type ExchangeRate,
} from './exchangeRate';

const cachedRate: ExchangeRate = {
  from: 'USD',
  to: 'BRL',
  rate: 5.2,
  quotedAt: '2026-11-17T10:00:00.000Z',
  fetchedAt: '2026-11-17T10:00:00.000Z',
};

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

describe('exchange rate cache freshness', () => {
  it('considers a quote fresh for up to three hours', () => {
    const now = new Date(cachedRate.fetchedAt).getTime();
    expect(isExchangeRateCacheFresh(cachedRate, now + EXCHANGE_RATE_CACHE_TTL - 1)).toBe(true);
  });

  it('considers an expired or future-dated quote stale', () => {
    const now = new Date(cachedRate.fetchedAt).getTime();
    expect(isExchangeRateCacheFresh(cachedRate, now + EXCHANGE_RATE_CACHE_TTL)).toBe(false);
    expect(isExchangeRateCacheFresh(cachedRate, now - 1)).toBe(false);
  });

  it('does not consider a missing quote fresh', () => {
    expect(isExchangeRateCacheFresh(null)).toBe(false);
  });
});
