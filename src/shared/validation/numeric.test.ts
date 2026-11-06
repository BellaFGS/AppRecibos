import { describe, expect, it } from 'vitest';
import { formatMoneyInput, parseDecimalInput, sanitizeDecimalInput } from './numeric';

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
});
