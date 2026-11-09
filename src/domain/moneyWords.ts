import type { Currency } from './models';

const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function underThousand(value: number): string {
  if (value === 0) return '';
  if (value === 100) return 'cem';
  const parts: string[] = [];
  const h = Math.floor(value / 100);
  const rest = value % 100;
  if (h) parts.push(hundreds[h]);
  if (rest >= 10 && rest < 20) parts.push(teens[rest - 10]);
  else {
    const t = Math.floor(rest / 10);
    const u = rest % 10;
    if (t) parts.push(tens[t]);
    if (u) parts.push(units[u]);
  }
  return parts.join(' e ');
}

function integerToWords(value: number): string {
  if (value === 0) return 'zero';
  if (!Number.isSafeInteger(value) || value < 0 || value > 999_999_999_999_999) {
    throw new RangeError('Valor fora do limite para conversão por extenso.');
  }
  const groups = [
    { divisor: 1_000_000_000_000, singular: 'trilhão', plural: 'trilhões' },
    { divisor: 1_000_000_000, singular: 'bilhão', plural: 'bilhões' },
    { divisor: 1_000_000, singular: 'milhão', plural: 'milhões' },
    { divisor: 1_000, singular: 'mil', plural: 'mil' },
    { divisor: 1, singular: '', plural: '' },
  ];
  let remaining = value;
  const parts: Array<{ text: string; amount: number }> = [];
  for (const group of groups) {
    const amount = Math.floor(remaining / group.divisor);
    if (!amount) continue;
    remaining %= group.divisor;
    if (group.divisor === 1_000) {
      parts.push({ text: amount === 1 ? 'mil' : `${underThousand(amount)} mil`, amount });
      continue;
    }
    const label = group.divisor === 1 ? '' : amount === 1 ? group.singular : group.plural;
    parts.push({ text: [underThousand(amount), label].filter(Boolean).join(' '), amount });
  }
  if (parts.length === 1) return parts[0].text;
  const last = parts.pop()!;
  const separator = last.amount < 100 || last.amount % 100 === 0 ? ' e ' : ', ';
  return `${parts.map((part) => part.text).join(', ')}${separator}${last.text}`;
}

export function amountToWords(cents: number, currency: Currency = 'BRL'): string {
  const safeCents = Math.max(0, Math.round(cents || 0));
  const whole = Math.floor(safeCents / 100);
  const fraction = safeCents % 100;
  const isReal = currency === 'BRL';
  const majorSingular = isReal ? 'real' : 'dólar';
  const majorPlural = isReal ? 'reais' : 'dólares';
  const minorSingular = isReal ? 'centavo' : 'cent';
  const minorPlural = isReal ? 'centavos' : 'cents';
  const major = whole === 1 ? majorSingular : majorPlural;
  const minor = fraction === 1 ? minorSingular : minorPlural;
  let result: string;
  if (whole === 0 && fraction === 0) result = `zero ${majorPlural}`;
  else if (whole === 0) result = `${integerToWords(fraction)} ${minor}`;
  else if (fraction === 0) result = `${integerToWords(whole)} ${major}`;
  else result = `${integerToWords(whole)} ${major} e ${integerToWords(fraction)} ${minor}`;

  return result.toLocaleUpperCase('pt-BR');
}
