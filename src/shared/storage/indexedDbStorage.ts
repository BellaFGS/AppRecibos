import type { KeyValueStorage } from './types';

const DATABASE_NAME = 'pj-owl-database';
const DATABASE_VERSION = 1;
const STORE_NAME = 'records';

export class IndexedDbStorage implements KeyValueStorage {
  private databasePromise: Promise<IDBDatabase> | null = null;

  private database(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB não está disponível neste ambiente.'));
    }
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'key' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o banco local.'));
        request.onblocked = () => reject(new Error('O banco local está bloqueado por outra aba. Feche as outras abas e tente novamente.'));
      });
    }
    return this.databasePromise;
  }

  async get<T>(key: string): Promise<T | null> {
    const database = await this.database();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value as T : null);
      request.onerror = () => reject(request.error ?? new Error(`Falha ao ler ${key}.`));
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const database = await this.database();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ key, value });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error(`Falha ao gravar ${key}.`));
      transaction.onabort = () => reject(transaction.error ?? new Error(`Gravação de ${key} cancelada.`));
    });
  }

  async remove(key: string): Promise<void> {
    const database = await this.database();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error(`Falha ao remover ${key}.`));
    });
  }

  async keys(): Promise<string[]> {
    const database = await this.database();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAllKeys();
      request.onsuccess = () => resolve(request.result.map(String));
      request.onerror = () => reject(request.error ?? new Error('Falha ao listar os dados locais.'));
    });
  }
}
