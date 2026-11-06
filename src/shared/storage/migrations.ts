import type { KeyValueStorage, StorageKey } from './types';

export const CURRENT_SCHEMA_VERSION = 1;
const LEGACY_PREFIX = 'recibofacil:';
const DATA_KEYS: StorageKey[] = ['profile', 'compositions', 'appointments', 'expenses', 'receipts'];

/** Migração idempotente: não remove nem altera as chaves antigas do navegador. */
export async function runMigrations(storage: KeyValueStorage): Promise<void> {
  const currentVersion = (await storage.get<number>('meta:schemaVersion')) ?? 0;
  if (currentVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`O banco foi criado por uma versão mais nova (${currentVersion}). Atualize o PJ OWL.`);
  }

  if (currentVersion < 1) {
    for (const key of DATA_KEYS) {
      const alreadyMigrated = await storage.get<unknown>(key);
      if (alreadyMigrated !== null) continue;
      const legacyValue = typeof localStorage === 'undefined' ? null : localStorage.getItem(`${LEGACY_PREFIX}${key}`);
      if (legacyValue === null) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(legacyValue);
      } catch {
        throw new Error(`Os dados antigos de "${key}" estão inválidos. Eles foram preservados no navegador e não foram apagados.`);
      }
      await storage.set(key, parsed);
    }
    await storage.set('meta:schemaVersion', 1);
  }
}
