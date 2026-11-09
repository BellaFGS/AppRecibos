/** Converte texto monetário pt-BR para centavos inteiros (mínimo 0). */
export function parseMoneyToCents(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(/[^0-9,.-]/g, '');
  if (normalized.includes('-')) return 0;
  const lastComma = normalized.lastIndexOf(',');
  let whole: string;
  let fraction = '00';
  if (lastComma >= 0) {
    whole = normalized.slice(0, lastComma).replace(/\./g, '').replace(/\D/g, '');
    fraction = normalized.slice(lastComma + 1).replace(/\D/g, '').padEnd(2, '0').slice(0, 2);
  } else {
    whole = normalized.replace(/\./g, '').replace(/\D/g, '');
  }
  if (!whole && fraction === '00') return 0;
  const cents = Number(whole || '0') * 100 + Number(fraction);
  if (!Number.isFinite(cents) || cents < 0) return 0;
  return Math.round(cents);
}

/** Exibe centavos salvos no mesmo padrão de entrada monetária. */
export function formatCentsForInput(cents: number): string {
  if (!cents || cents <= 0) return '';
  return formatMoneyInput(String(Math.round(cents)));
}

/** Mantém somente números e um separador decimal, usando vírgula na interface pt-BR. */
export function sanitizeDecimalInput(value: string, maxDecimals = 2): string {
  const cleaned = value.replace(/[^\d,.]/g, '');
  const separatorIndex = cleaned.search(/[,.]/);
  if (separatorIndex < 0) return cleaned;
  const integer = cleaned.slice(0, separatorIndex).replace(/\D/g, '');
  const decimals = cleaned.slice(separatorIndex + 1).replace(/\D/g, '').slice(0, maxDecimals);
  return `${integer},${decimals}`;
}

export function parseDecimalInput(value: string): number {
  if (!value) return 0;
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Máscara monetária: os dígitos digitados representam centavos. */
export function formatMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  if (!digits) return '';
  const cents = Number(digits);
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
