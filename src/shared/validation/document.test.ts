import { describe, expect, it } from 'vitest';
import {
  formatDocument,
  getOptionalDocumentError,
  normalizeDocument,
  sanitizeDocumentInput,
  validateCnpj,
  validateCpf,
  validateDocument,
} from './document';

describe('CPF', () => {
  it('valida CPF correto com e sem pontuação', () => {
    expect(validateCpf('529.982.247-25')).toBe(true);
    expect(validateCpf('52998224725')).toBe(true);
  });
  it('rejeita dígitos verificadores incorretos e sequências repetidas', () => {
    expect(validateCpf('529.982.247-24')).toBe(false);
    expect(validateCpf('111.111.111-11')).toBe(false);
  });
});

describe('CNPJ alfanumérico', () => {
  it('valida CNPJ numérico legado', () => {
    expect(validateCnpj('11.222.333/0001-81')).toBe(true);
  });
  it('valida CNPJ alfanumérico com dígitos verificadores', () => {
    // Exemplo de teste gerado pela regra oficial ASCII - 48.
    expect(validateCnpj('12ABC34501DE35')).toBe(true);
    expect(formatDocument('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
  });
  it('rejeita letras nas posições dos dígitos verificadores e CNPJ inválido', () => {
    expect(validateCnpj('12ABC34501DE3A')).toBe(false);
    expect(validateCnpj('11.222.333/0001-80')).toBe(false);
  });
});

describe('máscara e normalização', () => {
  it('normaliza entrada pontuada e aplica máscara de CPF', () => {
    expect(normalizeDocument('529.982.247-25')).toBe('52998224725');
    expect(formatDocument('52998224725')).toBe('529.982.247-25');
  });
  it('aceita somente letras e números e limita a entrada', () => {
    expect(sanitizeDocumentInput('12.abC-345/01de-35')).toBe('12ABC34501DE35');
    expect(sanitizeDocumentInput('529.982.247-25')).toBe('52998224725');
  });
  it('mantém documento opcional e acusa valores incompletos', () => {
    expect(getOptionalDocumentError('')).toBeNull();
    expect(getOptionalDocumentError('529982')).toMatch(/incompleto/i);
    expect(getOptionalDocumentError('12ABC34501DE')).toMatch(/incompleto/i);
  });
  it('rejeita documento inválido', () => {
    expect(validateDocument('123')).toBe(false);
    expect(getOptionalDocumentError('123')).toMatch(/incompleto/i);
  });
});
