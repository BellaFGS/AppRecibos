export type StorageKey = 'profile' | 'compositions' | 'appointments' | 'expenses' | 'receipts';

export interface KeyValueStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export interface Repository<T> {
  get(): Promise<T>;
  save(value: T): Promise<void>;
}

export interface BackupData {
  profile: unknown;
  compositions: unknown[];
  appointments: unknown[];
  expenses: unknown[];
  receipts: unknown[];
}

export interface BackupDocument {
  format: 'pj-owl-backup';
  backupVersion: 1;
  schemaVersion: number;
  createdAt: string;
  data: BackupData;
}
