import { describe, expect, it } from 'vitest';
import { amountToWords } from './moneyWords';

describe('amountToWords', () => {
  it('writes zero, integer and decimal BRL amounts', () => {
    expect(amountToWords(0, 'BRL')).toBe('ZERO REAIS');
    expect(amountToWords(100, 'BRL')).toBe('UM REAL');
    expect(amountToWords(2590, 'BRL')).toBe('VINTE E CINCO REAIS E NOVENTA CENTAVOS');
    expect(amountToWords(1, 'BRL')).toBe('UM CENTAVO');
  });
  it('writes USD using dollars and cents', () => {
    expect(amountToWords(100, 'USD')).toBe('UM DÓLAR');
    expect(amountToWords(105, 'USD')).toBe('UM DÓLAR E CINCO CENTS');
    expect(amountToWords(2500, 'USD')).toBe('VINTE E CINCO DÓLARES');
  });
  it('supports large amounts', () => {
    expect(amountToWords(12345678900, 'BRL')).toBe('CENTO E VINTE E TRÊS MILHÕES, QUATROCENTOS E CINQUENTA E SEIS MIL, SETECENTOS E OITENTA E NOVE REAIS');
  });
});
