/** Documentos brasileiros: CPF numérico e CNPJ alfanumérico (12 posições + 2 DVs). */
export type DocumentKind = 'cpf' | 'cnpj' | null;

export function normalizeDocument(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
}

export function getDocumentKind(value: string): DocumentKind {
  const normalized = normalizeDocument(value);
  if (!normalized) return null;
  return /[A-Z]/.test(normalized) || normalized.length > 11 ? 'cnpj' : 'cpf';
}

/** Limita e normaliza a entrada durante a digitação, sem gravar pontuação. */
export function sanitizeDocumentInput(value: string): string {
  const normalized = normalizeDocument(value);
  if (/[A-Z]/.test(normalized) || normalized.length > 11) {
    // CNPJ: 12 posições alfanuméricas e dois dígitos verificadores numéricos.
    const base = normalized.slice(0, 12);
    const checkDigits = normalized.slice(12, 14).replace(/\D/g, '');
    return `${base}${checkDigits}`;
  }
  return normalized.replace(/\D/g, '').slice(0, 11);
}

export function formatDocument(value: string): string {
  const normalized = sanitizeDocumentInput(value);
  if (!normalized) return '';
  if (getDocumentKind(normalized) === 'cpf') {
    return normalized
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  const first = normalized.slice(0, 2);
  const second = normalized.slice(2, 5);
  const third = normalized.slice(5, 8);
  const branch = normalized.slice(8, 12);
  const digits = normalized.slice(12, 14);
  let formatted = first;
  if (second) formatted += `.${second}`;
  if (third) formatted += `.${third}`;
  if (branch) formatted += `/${branch}`;
  if (digits) formatted += `-${digits}`;
  return formatted;
}

function calculateCpfDigit(base: string): number {
  const sum = [...base].reduce(
    (total, digit, index) => total + Number(digit) * (base.length + 1 - index),
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function cnpjCharacterValue(character: string): number {
  // Regra oficial do CNPJ alfanumérico: valor ASCII menos 48.
  return character.charCodeAt(0) - 48;
}

function calculateCnpjDigit(base: string, weights: number[]): number {
  const sum = [...base].reduce(
    (total, character, index) => total + cnpjCharacterValue(character) * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function validateCpf(value: string): boolean {
  const cpf = normalizeDocument(value);
  if (!/^\d{11}$/.test(cpf) || /^([0-9])\1{10}$/.test(cpf)) return false;
  const first = calculateCpfDigit(cpf.slice(0, 9));
  const second = calculateCpfDigit(`${cpf.slice(0, 9)}${first}`);
  return cpf.endsWith(`${first}${second}`);
}

export function validateCnpj(value: string): boolean {
  const cnpj = normalizeDocument(value);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^([A-Z0-9])\1{13}$/.test(cnpj)) return false;
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const first = calculateCnpjDigit(cnpj.slice(0, 12), firstWeights);
  const second = calculateCnpjDigit(`${cnpj.slice(0, 12)}${first}`, secondWeights);
  return cnpj.endsWith(`${first}${second}`);
}

export function validateDocument(value: string): boolean {
  const normalized = normalizeDocument(value);
  if (!normalized) return false;
  return getDocumentKind(normalized) === 'cpf'
    ? validateCpf(normalized)
    : validateCnpj(normalized);
}

/** Documento é opcional. Retorna mensagem somente quando foi preenchido e é inválido. */
export function getOptionalDocumentError(value: string): string | null {
  if (!normalizeDocument(value)) return null;
  const kind = getDocumentKind(value);
  if (kind === 'cpf' && normalizeDocument(value).length !== 11) return 'CPF incompleto. Informe os 11 dígitos.';
  if (kind === 'cnpj' && normalizeDocument(value).length !== 14) return 'CNPJ incompleto. Informe as 12 posições e os 2 dígitos verificadores.';
  if (!validateDocument(value)) return `${kind === 'cpf' ? 'CPF' : 'CNPJ'} inválido. Confira os caracteres e os dígitos verificadores.`;
  return null;
}
