import { describe, expect, it } from 'vitest';
import { calculateResourceCostCents, estimateMaterialPurchase } from './calculator';
import type { CalculatorResource } from './models';

describe('estimateMaterialPurchase', () => {
  it('arredonda embalagens para cima e calcula sobra em comprimento', () => {
    expect(estimateMaterialPurchase(35,'cm',1,'m',2500)).toEqual({packages:1,purchasedQuantity:1,leftover:0.65,totalPurchaseCents:2500});
  });
  it('calcula compra por peso', () => {
    expect(estimateMaterialPurchase(1500,'g',1,'kg',3000).packages).toBe(2);
  });
  it('calcula compra por volume', () => {
    expect(estimateMaterialPurchase(1500,'ml',1,'L',2000).packages).toBe(2);
  });
  it('calcula compra por unidade', () => {
    expect(estimateMaterialPurchase(11,'un',10,'un',500).totalPurchaseCents).toBe(1000);
  });
  it('rejeita grupos incompatíveis', () => {
    expect(() => estimateMaterialPurchase(2,'kg',1,'L',100)).toThrow(/incompatíveis/);
  });
});


describe('calculateResourceCostCents', () => {
  const base: CalculatorResource = { id:'r1', name:'Papel', kind:'material', quantity:35, unit:'cm', referenceQuantity:1, referenceUnit:'m', unitPrice:2500, currency:'BRL' };
  it('calcula custo proporcional de material', () => { expect(calculateResourceCostCents(base)).toBe(875); });
  it('calcula materiais pelo preço da unidade selecionada, sem embalagem de compra', () => {
    const material: CalculatorResource = {
      id: 'r2',
      name: 'Tecido',
      kind: 'material',
      quantity: 3.5,
      unit: 'm',
      referenceQuantity: 1,
      referenceUnit: 'm',
      unitPrice: 1250,
      currency: 'BRL',
    };
    expect(calculateResourceCostCents(material)).toBe(4375);
  });
  it('converte custo em dólar usando a cotação salva', () => { expect(calculateResourceCostCents({...base,kind:'monthly',quantity:1,unit:'mensal',referenceUnit:'mensal',unitPrice:1000,currency:'USD',exchangeRate:5.2})).toBe(5200); });
  it('calcula cobrança por hora', () => { expect(calculateResourceCostCents({...base,kind:'hourly',quantity:2,unit:'hora',referenceQuantity:1,referenceUnit:'hora',unitPrice:3500})).toBe(7000); });
  it('calcula frações de hora, como uma hora e meia', () => { expect(calculateResourceCostCents({...base,kind:'hourly',quantity:1.5,unit:'hora',referenceQuantity:1,referenceUnit:'hora',unitPrice:3500})).toBe(5250); });
});
