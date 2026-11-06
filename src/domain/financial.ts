import type { PricingMode } from './models';

export interface PricingResult {
  suggestedPrice: number;
  finalPrice: number;
  profit: number;
  actualMargin: number;
}

/** Recebe custo em centavos e percentual em pontos percentuais (ex.: 30 = 30%). */
export function calculatePricing(
  costCents: number,
  percentage: number,
  mode: PricingMode,
  manualPriceCents?: number,
): PricingResult {
  if (!Number.isFinite(costCents) || costCents < 0) throw new RangeError('O custo deve ser um valor não negativo.');
  if (!Number.isFinite(percentage) || percentage < 0) throw new RangeError('O percentual deve ser não negativo.');
  const rate = percentage / 100;
  const suggestedPrice = mode === 'markup'
    ? Math.round(costCents * (1 + rate))
    : rate >= 1 ? costCents : Math.round(costCents / (1 - rate));
  const finalPrice = manualPriceCents ?? suggestedPrice;
  if (!Number.isFinite(finalPrice) || finalPrice < 0) throw new RangeError('O preço final deve ser um valor não negativo.');
  const profit = finalPrice - costCents;
  const actualMargin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
  return { suggestedPrice, finalPrice, profit, actualMargin };
}
