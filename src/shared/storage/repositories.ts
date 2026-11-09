
import type {
  KeyValueStorage,
  Repository,
  StorageKey,
} from './types';

const DEFAULTS: Record<StorageKey, unknown> = {
  profile: {
    ownerName: '',
    businessName: '',
    startDate: '',
    document: '',
    logo: '',
    signature: '',
  },
  compositions: [],
  appointments: [],
  expenses: [],
  receipts: [],
  calculations: [],
};

export class LocalRepository<T> implements Repository<T> {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key: StorageKey,
    private readonly fallback: T,
  ) {}

  async get(): Promise<T> {
    return (await this.storage.get<T>(this.key)) ?? this.fallback;
  }

  save(value: T): Promise<void> {
    this.queue = this.queue.then(() =>
      this.storage.set(this.key, value),
    );

    return this.queue;
  }
}

export interface AppRepositories {
  profile: Repository<unknown>;
  compositions: Repository<unknown[]>;
  appointments: Repository<unknown[]>;
  expenses: Repository<unknown[]>;
  receipts: Repository<unknown[]>;
  calculations: Repository<unknown[]>;
}

export function createRepositories(
  storage: KeyValueStorage,
): AppRepositories {
  return {
    profile: new LocalRepository<unknown>(
      storage,
      'profile',
      DEFAULTS.profile,
    ),

    compositions: new LocalRepository<unknown[]>(
      storage,
      'compositions',
      DEFAULTS.compositions as unknown[],
    ),

    appointments: new LocalRepository<unknown[]>(
      storage,
      'appointments',
      DEFAULTS.appointments as unknown[],
    ),

    expenses: new LocalRepository<unknown[]>(
      storage,
      'expenses',
      DEFAULTS.expenses as unknown[],
    ),

    receipts: new LocalRepository<unknown[]>(
      storage,
      'receipts',
      DEFAULTS.receipts as unknown[],
    ),

    calculations: new LocalRepository<unknown[]>(
      storage,
      'calculations',
      DEFAULTS.calculations as unknown[],
    ),
  };
}

export async function loadAllRepositories(
  repositories: AppRepositories,
) {
  const [
    profile,
    compositions,
    appointments,
    expenses,
    receipts,
    calculations,
  ] = await Promise.all([
    repositories.profile.get(),
    repositories.compositions.get(),
    repositories.appointments.get(),
    repositories.expenses.get(),
    repositories.receipts.get(),
    repositories.calculations.get(),
  ]);

  return {
    profile,
    compositions,
    appointments,
    expenses,
    receipts,
    calculations,
  };
}
