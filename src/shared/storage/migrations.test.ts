import { afterEach, describe, expect, it } from 'vitest';
import { runMigrations } from './migrations';
import type { KeyValueStorage } from './types';

class MemoryStorage implements KeyValueStorage {
  values = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> { return (this.values.get(key) as T | undefined) ?? null; }
  async set<T>(key: string, value: T): Promise<void> { this.values.set(key, value); }
  async remove(key: string): Promise<void> { this.values.delete(key); }
  async keys(): Promise<string[]> { return [...this.values.keys()]; }
}

const originalLocalStorage = globalThis.localStorage;

afterEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalLocalStorage });
});

describe('migrações de armazenamento', () => {
  it('importa os cinco domínios legados sem apagar a origem', async () => {
    const legacy: Record<string, string> = {
      'recibofacil:profile': JSON.stringify({ ownerName: 'Bella' }),
      'recibofacil:compositions': JSON.stringify([{ id: 'c1' }]),
      'recibofacil:appointments': JSON.stringify([{ id: 'a1' }]),
      'recibofacil:expenses': JSON.stringify([{ id: 'e1' }]),
      'recibofacil:receipts': JSON.stringify([{ id: 'r1' }]),
    };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => legacy[key] ?? null } });
    const storage = new MemoryStorage();
    await runMigrations(storage);
    expect(await storage.get<{ ownerName: string }>('profile')).toEqual({ ownerName: 'Bella' });
    expect(await storage.get<number>('meta:schemaVersion')).toBe(1);
    expect(legacy['recibofacil:receipts']).toBeTruthy();
  });

  it('não marca a migração como concluída quando um legado está corrompido', async () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => key === 'recibofacil:receipts' ? '{json quebrado' : null } });
    const storage = new MemoryStorage();
    await expect(runMigrations(storage)).rejects.toThrow('estão inválidos');
    expect(await storage.get('meta:schemaVersion')).toBeNull();
  });
});
