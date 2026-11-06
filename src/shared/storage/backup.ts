
import type {
  BackupData,
  BackupDocument,
  KeyValueStorage,
  StorageKey,
} from './types';

import { CURRENT_SCHEMA_VERSION } from './migrations';

const DATA_KEYS: StorageKey[] = [
  'profile',
  'compositions',
  'appointments',
  'expenses',
  'receipts',
];

const DEFAULT_PROFILE = {
  ownerName: '',
  businessName: '',
  startDate: '',
  document: '',
  logo: '',
  signature: '',
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value);

function validateCollection(
  value: unknown,
  collection: string,
): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Os dados de ${collection} estão em formato inválido.`,
    );
  }

  if (!value.every(isObject)) {
    throw new Error(
      `O backup contém registros inválidos em ${collection}.`,
    );
  }

  return value;
}

export function validateBackup(input: unknown): BackupDocument {
  if (
    !isObject(input) ||
    input.format !== 'pj-owl-backup' ||
    input.backupVersion !== 1 ||
    !isObject(input.data)
  ) {
    throw new Error(
      'Arquivo inválido. Selecione um backup gerado pelo PJ OWL.',
    );
  }

  const data = input.data;

  if (!isObject(data.profile)) {
    throw new Error(
      'O perfil do backup está ausente ou possui formato inválido.',
    );
  }

  const validatedData: BackupData = {
    profile: data.profile,
    compositions: validateCollection(data.compositions, 'composições'),
    appointments: validateCollection(data.appointments, 'agenda'),
    expenses: validateCollection(data.expenses, 'despesas'),
    receipts: validateCollection(data.receipts, 'recibos'),
  };

  if (
    typeof input.createdAt !== 'string' ||
    Number.isNaN(Date.parse(input.createdAt))
  ) {
    throw new Error('A data de criação do backup é inválida.');
  }

  if (
    typeof input.schemaVersion !== 'number' ||
    input.schemaVersion < 1 ||
    input.schemaVersion > CURRENT_SCHEMA_VERSION
  ) {
    throw new Error(
      'A versão deste backup não é compatível com esta versão do PJ OWL.',
    );
  }

  return {
    format: 'pj-owl-backup',
    backupVersion: 1,
    schemaVersion: input.schemaVersion,
    createdAt: input.createdAt,
    data: validatedData,
  };
}

export async function createBackup(
  storage: KeyValueStorage,
): Promise<BackupDocument> {
  const [
    profileValue,
    compositionsValue,
    appointmentsValue,
    expensesValue,
    receiptsValue,
  ] = await Promise.all(
    DATA_KEYS.map((key) => storage.get(key)),
  );

  const profile = profileValue ?? DEFAULT_PROFILE;

  if (!isObject(profile)) {
    throw new Error(
      'Não foi possível criar o backup: os dados do perfil estão inválidos.',
    );
  }

  const data: BackupData = {
    profile,
    compositions: validateCollection(
      compositionsValue ?? [],
      'composições',
    ),
    appointments: validateCollection(
      appointmentsValue ?? [],
      'agenda',
    ),
    expenses: validateCollection(
      expensesValue ?? [],
      'despesas',
    ),
    receipts: validateCollection(
      receiptsValue ?? [],
      'recibos',
    ),
  };

  return {
    format: 'pj-owl-backup',
    backupVersion: 1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    data,
  };
}

/**
 * Valida todos os dados antes de gravar.
 * Caso alguma gravação falhe, tenta restaurar o estado anterior.
 */
export async function restoreBackup(
  storage: KeyValueStorage,
  raw: unknown,
): Promise<void> {
  const backup = validateBackup(raw);
  const previous = await createBackup(storage);

  try {
    for (const key of DATA_KEYS) {
      await storage.set(key, backup.data[key]);
    }

    await storage.set(
      'meta:schemaVersion',
      CURRENT_SCHEMA_VERSION,
    );
  } catch (error) {
    try {
      for (const key of DATA_KEYS) {
        await storage.set(key, previous.data[key]);
      }
    } catch {
      throw new Error(
        'A restauração falhou e também não foi possível reverter todos os dados. ' +
        'Não feche o aplicativo. Exporte os dados disponíveis e tente novamente.',
      );
    }

    throw new Error(
      'A restauração falhou. Os dados anteriores foram preservados. ' +
      (error instanceof Error ? error.message : ''),
    );
  }
}

export async function getStorageUsageBytes(
  storage: KeyValueStorage,
): Promise<number> {
  const keys = await storage.keys();

  const values = await Promise.all(
    keys.map((key) => storage.get(key)),
  );

  return new Blob(
    values.map((value) => JSON.stringify(value ?? null)),
  ).size;
}

export function downloadBackupFile(
  backup: BackupDocument,
): void {
  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: 'application/json' },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download =
    `pj-owl-backup-${new Date().toISOString().slice(0, 10)}.json`;

  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
