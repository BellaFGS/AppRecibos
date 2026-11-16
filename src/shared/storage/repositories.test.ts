import { describe, expect, it } from 'vitest';
import { LocalRepository } from './repositories';
import type { KeyValueStorage } from './types';

class DelayedStorage implements KeyValueStorage {
  values = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null;
  }
  async set<T>(key: string, value: T): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    this.values.set(key, value);
  }
  async remove(key: string): Promise<void> { this.values.delete(key); }
  async keys(): Promise<string[]> { return [...this.values.keys()]; }
}

describe('LocalRepository fila de persistência', () => {
  it('flush aguarda gravações já enfileiradas', async () => {
    const storage = new DelayedStorage();
    const repository = new LocalRepository(storage, 'receipts', [] as unknown[]);

    const save = repository.save([{ id: 'antigo' }]);
    await repository.flush();
    await save;

    expect(await storage.get('receipts')).toEqual([{ id: 'antigo' }]);
  });

  it('permite novas gravações depois de uma falha anterior', async () => {
    const storage = new DelayedStorage();
    const repository = new LocalRepository(storage, 'receipts', [] as unknown[]);
    const failingStorage = storage as DelayedStorage & { fail?: boolean };
    const originalSet = storage.set.bind(storage);
    storage.set = async <T>(key: string, value: T) => {
      if (failingStorage.fail) {
        failingStorage.fail = false;
        throw new Error('Falha simulada');
      }
      await originalSet(key, value);
    };

    failingStorage.fail = true;
    await expect(repository.save([{ id: 'falha' }])).rejects.toThrow('Falha simulada');
    await repository.save([{ id: 'recuperado' }]);

    expect(await storage.get('receipts')).toEqual([{ id: 'recuperado' }]);
  });
});
