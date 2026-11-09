import { describe, expect, it } from 'vitest';
import { createBackup, restoreBackup, validateBackup } from './backup';
import type { KeyValueStorage } from './types';

class MemoryStorage implements KeyValueStorage {
  values = new Map<string, unknown>();
  failOnKey: string | null = null;
  async get<T>(key: string): Promise<T | null> { return (this.values.get(key) as T | undefined) ?? null; }
  async set<T>(key: string, value: T): Promise<void> {
    if (key === this.failOnKey) { this.failOnKey = null; throw new Error('Falha simulada'); }
    this.values.set(key, value);
  }
  async remove(key: string): Promise<void> { this.values.delete(key); }
  async keys(): Promise<string[]> { return [...this.values.keys()]; }
}

const sampleData = {
  profile: { ownerName: 'Pessoa Teste', businessName: 'Ateliê Teste', startDate: '', document: '', logo: '', signature: '' },
  compositions: [{ id: 'c1', name: 'Composição' }],
  appointments: [{ id: 'a1', description: 'Entrega' }],
  expenses: [{ id: 'e1', description: 'Material' }],
  receipts: [{ id: 'r1', clientName: 'Cliente' }],
  calculations: [{ id: 'calc1', description: 'Produto teste' }],
};

describe('backup PJ OWL', () => {
  it('valida um backup completo', () => {
    const backup = { format: 'pj-owl-backup', backupVersion: 1, schemaVersion: 1, createdAt: new Date().toISOString(), data: sampleData };
    expect(validateBackup(backup).data.receipts).toHaveLength(1);
  });

  it('rejeita arquivo inválido sem alterar o armazenamento', async () => {
    const storage = new MemoryStorage();
    await storage.set('receipts', [{ id: 'original' }]);
    await expect(restoreBackup(storage, { nope: true })).rejects.toThrow('Arquivo inválido');
    expect(await storage.get('receipts')).toEqual([{ id: 'original' }]);
  });

  it('exporta e restaura os domínios persistidos', async () => {
    const storage = new MemoryStorage();
    for (const [key, value] of Object.entries(sampleData)) await storage.set(key, value);
    const backup = await createBackup(storage);
    await storage.set('receipts', []);
    await restoreBackup(storage, backup);
    expect(await storage.get('receipts')).toEqual(sampleData.receipts);
    expect(await storage.get('profile')).toEqual(sampleData.profile);
  });

  it('tenta reverter os dados anteriores se uma gravação falhar', async () => {
    const storage = new MemoryStorage();
    for (const key of ['profile', 'compositions', 'appointments', 'expenses', 'receipts', 'calculations']) await storage.set(key, key === 'profile' ? sampleData.profile : []);
    const backup = { format: 'pj-owl-backup', backupVersion: 1, schemaVersion: 1, createdAt: new Date().toISOString(), data: sampleData };
    storage.failOnKey = 'expenses';
    await expect(restoreBackup(storage, backup)).rejects.toThrow('dados anteriores foram preservados');
    expect(await storage.get('receipts')).toEqual([]);
  });
});
