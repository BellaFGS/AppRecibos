import type { CalculatorResource, Unit } from './models';

const FACTORS: Record<Unit, number> = { mm: 0.001, cm: 0.01, m: 1, g: 1, kg: 1000, ml: 1, L: 1000, un: 1 };

/** Custo do recurso em centavos BRL. Preços USD exigem a cotação registrada no próprio recurso. */
export function calculateResourceCostCents(resource: CalculatorResource): number {
  if (!Number.isFinite(resource.quantity) || resource.quantity < 0 || !Number.isFinite(resource.unitPrice) || resource.unitPrice < 0) {
    throw new RangeError('Quantidade e preço do recurso devem ser valores válidos e não negativos.');
  }
  let original = resource.unitPrice * resource.quantity;
  if (resource.kind === 'material') {
    const usedUnit = resource.unit as Unit;
    const packUnit = resource.referenceUnit as Unit;
    if (resource.referenceQuantity <= 0 || FACTORS[usedUnit] === undefined || FACTORS[packUnit] === undefined) {
      throw new RangeError('Referência de compra inválida.');
    }
    const groups = (unit: Unit) => ['mm','cm','m'].includes(unit) ? 'length' : ['g','kg'].includes(unit) ? 'weight' : ['ml','L'].includes(unit) ? 'volume' : 'count';
    if (groups(usedUnit) !== groups(packUnit)) throw new RangeError('As unidades do material são incompatíveis.');
    original = resource.unitPrice * (resource.quantity * FACTORS[usedUnit]) / (resource.referenceQuantity * FACTORS[packUnit]);
  }
  if (resource.currency === 'USD') {
    if (!Number.isFinite(resource.exchangeRate) || (resource.exchangeRate ?? 0) <= 0) throw new RangeError('O recurso em dólar não possui uma cotação válida registrada.');
    original *= resource.exchangeRate!;
  }
  return Math.round(original);
}

export interface PurchaseEstimate { packages: number; purchasedQuantity: number; leftover: number; totalPurchaseCents: number; }

/** Estima compra em embalagens inteiras, mantendo o custo integral da compra separado do custo proporcional consumido. */
export function estimateMaterialPurchase(needed: number, neededUnit: Unit, packageQuantity: number, packageUnit: Unit, packagePriceCents: number): PurchaseEstimate {
  if (![needed, packageQuantity, packagePriceCents].every(Number.isFinite) || needed < 0 || packageQuantity <= 0 || packagePriceCents < 0) throw new RangeError('Dados de compra inválidos.');
  const groups = (unit: Unit) => ['mm','cm','m'].includes(unit) ? 'length' : ['g','kg'].includes(unit) ? 'weight' : ['ml','L'].includes(unit) ? 'volume' : 'count';
  if (groups(neededUnit) !== groups(packageUnit)) throw new RangeError('As unidades de consumo e embalagem são incompatíveis.');
  const requiredBase = needed * FACTORS[neededUnit];
  const packageBase = packageQuantity * FACTORS[packageUnit];
  const packages = Math.ceil(requiredBase / packageBase);
  const purchasedQuantity = packages * packageBase;
  return {
    packages,
    purchasedQuantity,
    leftover: Math.max(
      0,
      Number((purchasedQuantity - requiredBase).toFixed(8))
    ),
    totalPurchaseCents: packages * packagePriceCents,
  };
}
