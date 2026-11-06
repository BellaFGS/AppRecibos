import { describe, expect, it } from 'vitest';
import type { Receipt } from '../domain/models';
import { filterReceipts, finalizeReceipt } from '../domain/receipts';
import { createRepositories, loadAllRepositories } from '../shared/storage/repositories';
import type { KeyValueStorage } from '../shared/storage/types';

class MemoryStorage implements KeyValueStorage {
  private values = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> { return (this.values.get(key) as T | undefined) ?? null; }
  async set<T>(key: string, value: T): Promise<void> { this.values.set(key, structuredClone(value)); }
  async remove(key: string): Promise<void> { this.values.delete(key); }
  async keys(): Promise<string[]> { return [...this.values.keys()]; }
}

const draft: Omit<Receipt, 'status'> = {
  id: 'RF-2026-TEST01', clientName: 'Maria Oliveira', clientDocument: '',
  providerName: 'Prestador PJ OWL', providerDocument: '', businessName: 'Ateliê Teste',
  description: 'Produto artesanal', amount: 2590, currency: 'BRL',
  paymentMethod: 'Pix', installment: '', notes: '', paymentDate: '2026-11-06',
  providerSignature: 'data:image/png;base64,provider', clientSignature: 'data:image/png;base64,client',
  finalizedAt: '2026-11-06T12:00:00.000Z',
};

describe('integração do ciclo de recibos e persistência', () => {
  it('finaliza um recibo e persiste o registro no repositório', async () => {
    const storage = new MemoryStorage();
    const repositories = createRepositories(storage);
    const receipt = finalizeReceipt(draft);

    expect(receipt.status).toBe('FINALIZADO');
    await repositories.receipts.save([receipt]);
    const data = await loadAllRepositories(repositories);
    expect(data.receipts).toEqual([receipt]);
  });

  it('mantém recibos finalizados após nova leitura e filtra por cliente e período', async () => {
    const storage = new MemoryStorage();
    const repositories = createRepositories(storage);
    const first = finalizeReceipt(draft);
    const second = finalizeReceipt({ ...draft, id: 'RF-2026-TEST02', clientName: 'João Souza', paymentDate: '2026-11-07' });
    await repositories.receipts.save([first, second]);

    const { receipts } = await loadAllRepositories(repositories);
    expect(filterReceipts(receipts as Receipt[], { query: 'maria', from: '2026-11-01', to: '2026-11-06' })).toEqual([first]);
    expect(filterReceipts(receipts as Receipt[], { from: '2026-11-07' })).toEqual([second]);
  });

  it('recusa finalizar recibo sem cliente ou com valor inválido', () => {
    expect(() => finalizeReceipt({ ...draft, clientName: ' ' })).toThrow('identificar o cliente');
    expect(() => finalizeReceipt({ ...draft, amount: -10 })).toThrow(RangeError);
  });
});
