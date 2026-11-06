export interface ExchangeRate {
  from: 'USD';
  to: 'BRL';
  rate: number;
  quotedAt: string;
  fetchedAt: string;
}

export function convertUsdCentsToBrlCents(usdCents: number, rate: number): number {
  if (!Number.isFinite(usdCents) || usdCents < 0 || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError('Valor ou cotação inválidos para conversão.');
  }
  return Math.round(usdCents * rate);
}

const CACHE_KEY = 'pj-owl:exchange-rate:USD-BRL';
const ENDPOINT = 'https://br.dolarapi.com/v1/cotacoes/usd';

function readCache(): ExchangeRate | null {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExchangeRate;
    return parsed?.from === 'USD' && parsed?.to === 'BRL' && Number.isFinite(parsed.rate) && parsed.rate > 0 ? parsed : null;
  } catch { return null; }
}

export function getCachedExchangeRate(): ExchangeRate | null { return readCache(); }

export async function fetchUsdBrlRate(): Promise<{ rate: ExchangeRate; stale: boolean }> {
  try {
    const response = await fetch(ENDPOINT, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000), cache: 'no-store' });
    if (!response.ok) throw new Error(`Cotação indisponível (HTTP ${response.status}).`);
    const payload = await response.json() as Array<{ compra?: number; dataAtualizacao?: string }> | { compra?: number; dataAtualizacao?: string };
    const quote = Array.isArray(payload) ? payload[0] : payload;
    const bid = Number(quote?.compra);
    if (!Number.isFinite(bid) || bid <= 0) throw new Error('A API retornou uma cotação inválida.');
    const rate: ExchangeRate = { from: 'USD', to: 'BRL', rate: bid, quotedAt: quote?.dataAtualizacao || new Date().toISOString(), fetchedAt: new Date().toISOString() };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(rate)); } catch { /* Cache é opcional. */ }
    return { rate, stale: false };
  } catch (error) {
    const cached = readCache();
    if (cached) return { rate: cached, stale: true };
    throw error instanceof Error ? error : new Error('Não foi possível consultar a cotação do dólar.');
  }
}

/** Formata a data/hora da cotação para o fuso de Brasília. */
export function formatExchangeRateDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  }).format(date);
}
