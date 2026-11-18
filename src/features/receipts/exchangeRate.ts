import { useCallback, useEffect, useState } from 'react';

export interface ExchangeRate {
  from: 'USD';
  to: 'BRL';
  rate: number;
  quotedAt: string;
  fetchedAt: string;
}

interface DolarApiQuote {
  compra?: number | string;
  venda?: number | string;
  dataAtualizacao?: string;
  nome?: string;
  moeda?: string;
}

const CACHE_KEY = 'pj-owl:exchange-rate:USD-BRL';
const ENDPOINT = 'https://br.dolarapi.com/v1/cotacoes/usd';
/** A cotação é considerada recente por até três horas. */
export const EXCHANGE_RATE_CACHE_TTL = 3 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 9000;

let pendingRequest: Promise<ExchangeRate> | null = null;

export function convertUsdCentsToBrlCents(usdCents: number, rate: number): number {
  if (!Number.isFinite(usdCents) || usdCents < 0 || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError('Valor ou cotação inválidos para conversão.');
  }
  return Math.round(usdCents * rate);
}

function isValidRate(value: unknown): value is ExchangeRate {
  if (!value || typeof value !== 'object') return false;
  const rate = value as Partial<ExchangeRate>;
  return rate.from === 'USD'
    && rate.to === 'BRL'
    && typeof rate.rate === 'number'
    && Number.isFinite(rate.rate)
    && rate.rate > 0
    && typeof rate.quotedAt === 'string'
    && typeof rate.fetchedAt === 'string';
}

function readCache(): ExchangeRate | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidRate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(rate: ExchangeRate): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rate));
    }
  } catch {
    // O cache é uma melhoria de disponibilidade, não deve impedir a conversão.
  }
}

export function getCachedExchangeRate(): ExchangeRate | null {
  return readCache();
}

export function isExchangeRateCacheFresh(rate: ExchangeRate | null, now = Date.now()): boolean {
  if (!rate) return false;
  const fetchedAt = new Date(rate.fetchedAt).getTime();
  return Number.isFinite(fetchedAt) && now - fetchedAt >= 0 && now - fetchedAt < EXCHANGE_RATE_CACHE_TTL;
}

async function requestUsdBrlRate(): Promise<ExchangeRate> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Cotação indisponível (HTTP ${response.status}).`);

    const payload: DolarApiQuote | DolarApiQuote[] = await response.json();
    const quote = Array.isArray(payload) ? payload[0] : payload;
    const bid = Number(quote?.compra);
    if (!Number.isFinite(bid) || bid <= 0) {
      throw new Error('A API retornou uma cotação inválida.');
    }

    const rate: ExchangeRate = {
      from: 'USD',
      to: 'BRL',
      rate: bid,
      quotedAt: quote.dataAtualizacao || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    };
    writeCache(rate);
    return rate;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Retorna a última cotação em cache quando a rede estiver indisponível.
 * Por padrão, evita chamadas à API enquanto o cache ainda estiver dentro de 3 horas.
 */
export async function fetchUsdBrlRate(options: { force?: boolean } = {}): Promise<{ rate: ExchangeRate; stale: boolean }> {
  const cached = readCache();
  const force = options.force === true;

  if (!force && cached && isExchangeRateCacheFresh(cached)) {
    return { rate: cached, stale: false };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (cached) return { rate: cached, stale: true };
    throw new Error('Você está offline e ainda não existe uma cotação salva neste dispositivo.');
  }

  try {
    if (!pendingRequest) {
      pendingRequest = requestUsdBrlRate().finally(() => { pendingRequest = null; });
    }
    const rate = await pendingRequest;
    return { rate, stale: false };
  } catch (error) {
    const latestCache = readCache();
    if (latestCache) return { rate: latestCache, stale: true };
    throw error instanceof Error
      ? error
      : new Error('Não foi possível consultar a cotação do dólar.');
  }
}

/**
 * Mantém a cotação disponível e sincronizada durante o uso do app.
 * Atualiza ao abrir, ao voltar a conexão, ao retornar à tela e a cada 3 horas.
 */
export function useUsdBrlRate(enabled: boolean) {
  const [rate, setRate] = useState<ExchangeRate | null>(() => getCachedExchangeRate());
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(() => {
    const cached = getCachedExchangeRate();
    return !!cached && !isExchangeRateCacheFresh(cached);
  });
  const [error, setError] = useState('');

  const refresh = useCallback(async (force = false) => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchUsdBrlRate({ force });
      setRate(result.rate);
      setStale(result.stale);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cotação do dólar indisponível.');
      const cached = getCachedExchangeRate();
      if (cached) {
        setRate(cached);
        setStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    void refresh();

    const handleOnline = () => { void refresh(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const interval = window.setInterval(() => { void refresh(); }, EXCHANGE_RATE_CACHE_TTL);

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, refresh]);

  return { rate, loading, stale, error, refresh };
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
