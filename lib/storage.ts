export const STORAGE_SCHEMA_VERSION = 1;

export const storageKeys = {
  savedItems: "meaningful-routes:v1:saved-items",
  walkSessions: "meaningful-routes:v1:walk-sessions",
  completedWalks: "meaningful-routes:v1:completed-walks",
  compareBasket: "meaningful-routes:v1:compare-basket",
  preferences: "meaningful-routes:v1:preferences",
  issueReports: "meaningful-routes:v1:issue-reports",
  featureFlags: "meaningful-routes:v1:feature-flags"
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

type StorageEnvelope<T> = {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  data: T;
  updatedAt: string;
};

type ReadOptions = {
  legacyKeys?: string[];
};

export function readStorageValue<T>(key: StorageKey, fallback: T, options: ReadOptions = {}): T {
  const storage = getLocalStorage();
  if (!storage) {
    return fallback;
  }

  const current = readRawValue<T>(storage, key);
  if (current.found) {
    return current.value;
  }

  for (const legacyKey of options.legacyKeys ?? []) {
    const legacy = readRawValue<T>(storage, legacyKey);
    if (legacy.found) {
      writeStorageValue(key, legacy.value);
      safeRemove(storage, legacyKey);
      return legacy.value;
    }
  }

  return fallback;
}

export function writeStorageValue<T>(key: StorageKey, value: T): boolean {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  const envelope: StorageEnvelope<T> = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    data: value,
    updatedAt: new Date().toISOString()
  };

  try {
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    // Storage may be disabled, full, or blocked by browser privacy settings.
    return false;
  }
}

export function clearStorageValue(key: StorageKey): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  safeRemove(storage, key);
}

function readRawValue<T>(storage: Storage, key: string): { found: true; value: T } | { found: false } {
  let raw: string | null = null;

  try {
    raw = storage.getItem(key);
  } catch {
    return { found: false };
  }

  if (!raw) {
    return { found: false };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isStorageEnvelope<T>(parsed)) {
      return { found: true, value: parsed.data };
    }

    return { found: true, value: parsed as T };
  } catch {
    return { found: false };
  }
}

function isStorageEnvelope<T>(value: unknown): value is StorageEnvelope<T> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "schemaVersion" in value &&
      "data" in value &&
      (value as { schemaVersion?: unknown }).schemaVersion === STORAGE_SCHEMA_VERSION
  );
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Storage may be unavailable even after a successful read.
  }
}
