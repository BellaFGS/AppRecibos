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
