import { describe, expect, it } from 'vitest';
import {
  formatCentsForInput,
  formatMoneyInput,
  parseDecimalInput,
  parseMoneyToCents,
  sanitizeDecimalInput,
} from './numeric';

describe('campos numéricos', () => {
  it('remove letras e mantém separador decimal', () => {
    expect(sanitizeDecimalInput('12a,3b4')).toBe('12,34');
    expect(sanitizeDecimalInput('1.25')).toBe('1,25');
  });
  it('converte decimal brasileiro para número', () => {
    expect(parseDecimalInput('1.234,56')).toBe(1234.56);
  });
  it('aplica máscara monetária em centavos', () => {
    expect(formatMoneyInput('123456')).toBe('1.234,56');
    expect(formatMoneyInput('abc')).toBe('');
  });

  it('converte entradas brasileiras para centavos', () => {
    expect(parseMoneyToCents('1.234,56')).toBe(123456);
    expect(parseMoneyToCents('R$ 25,90')).toBe(2590);
    expect(parseMoneyToCents('0,05')).toBe(5);
    expect(parseMoneyToCents('12,')).toBe(1200);
    expect(parseMoneyToCents('')).toBe(0);
    expect(parseMoneyToCents('-10,00')).toBe(0);
  });

  it('formata centavos de volta para a máscara de entrada', () => {
    expect(formatCentsForInput(123456)).toBe('1.234,56');
    expect(formatCentsForInput(0)).toBe('');
  });
});
