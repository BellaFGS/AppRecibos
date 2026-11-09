import type { Receipt } from './models';

export function finalizeReceipt(draft: Omit<Receipt, 'status'>): Receipt {
  if (!draft.id.trim()) throw new Error('O recibo precisa de um identificador.');
  if (!draft.clientName.trim()) throw new Error('O recibo precisa identificar o cliente.');
  if (!Number.isSafeInteger(draft.amount) || draft.amount < 0) throw new RangeError('O valor do recibo deve estar em centavos e não pode ser negativo.');
  if (!draft.paymentDate) throw new Error('O recibo precisa de uma data de pagamento.');
  if (!draft.finalizedAt) throw new Error('O recibo precisa registrar a data de finalização.');
  return { ...draft, status: 'FINALIZADO' };
}

export function filterReceipts(
  receipts: readonly Receipt[],
  criteria: { query?: string; from?: string; to?: string } = {},
): Receipt[] {
  const query = (criteria.query ?? '').trim().toLocaleLowerCase('pt-BR');
  return receipts.filter((receipt) =>
    receipt.clientName.toLocaleLowerCase('pt-BR').includes(query)
    && (!criteria.from || receipt.paymentDate >= criteria.from)
    && (!criteria.to || receipt.paymentDate <= criteria.to),
  );
}
