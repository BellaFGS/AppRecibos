import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { KeyValueStorage } from './types';

const DATABASE_NAME = 'pjowl';

/** Banco SQLite persistente no Android/iOS. A aplicação só conhece KeyValueStorage. */
export class CapacitorSqliteStorage implements KeyValueStorage {
  private connectionPromise: Promise<SQLiteDBConnection> | null = null;

  private connection(): Promise<SQLiteDBConnection> {
    if (!this.connectionPromise) {
      this.connectionPromise = (async () => {
        const sqlite = new SQLiteConnection(CapacitorSQLite);
        const consistency = await sqlite.checkConnectionsConsistency();
        const isConnected = (await sqlite.isConnection(DATABASE_NAME, false)).result;
        const database = consistency.result && isConnected
          ? await sqlite.retrieveConnection(DATABASE_NAME, false)
          : await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
        await database.open();
        await database.execute('CREATE TABLE IF NOT EXISTS app_records (record_key TEXT PRIMARY KEY NOT NULL, record_value TEXT NOT NULL)');
        return database;
      })();
    }
    return this.connectionPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    const database = await this.connection();
    const result = await database.query('SELECT record_value FROM app_records WHERE record_key = ?', [key]);
    const value = result.values?.[0]?.record_value;
    return typeof value === 'string' ? JSON.parse(value) as T : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const database = await this.connection();
    await database.run(
      'INSERT INTO app_records (record_key, record_value) VALUES (?, ?) ON CONFLICT(record_key) DO UPDATE SET record_value = excluded.record_value',
      [key, JSON.stringify(value)],
    );
  }

  async remove(key: string): Promise<void> {
    const database = await this.connection();
    await database.run('DELETE FROM app_records WHERE record_key = ?', [key]);
  }

  async keys(): Promise<string[]> {
    const database = await this.connection();
    const result = await database.query('SELECT record_key FROM app_records');
    return (result.values ?? []).map((row) => String(row.record_key));
  }
}
