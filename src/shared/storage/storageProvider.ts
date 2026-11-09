import { Capacitor } from '@capacitor/core';
import type { KeyValueStorage } from './types';
import { IndexedDbStorage } from './indexedDbStorage';
import { runMigrations } from './migrations';

export interface InitializedStorage {
  storage: KeyValueStorage;
  kind: 'capacitor-sqlite' | 'indexeddb';
}

export async function initializeStorage(): Promise<InitializedStorage> {
  let storage: KeyValueStorage;
  let kind: InitializedStorage['kind'];

  if (Capacitor.isNativePlatform()) {
    const { CapacitorSqliteStorage } = await import('./capacitorSqliteStorage');
    storage = new CapacitorSqliteStorage();
    kind = 'capacitor-sqlite';
  } else {
    storage = new IndexedDbStorage();
    kind = 'indexeddb';
  }

  await runMigrations(storage);
  return { storage, kind };
}
