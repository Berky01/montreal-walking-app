import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearStorageValue, readStorageValue, storageKeys, writeStorageValue } from "@/lib/storage";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key)
      }
    }
  });
});

describe("versioned local storage", () => {
  it("writes values in a schema-versioned envelope under canonical keys", () => {
    writeStorageValue(storageKeys.savedItems, [{ id: "saved-route" }]);

    const raw = JSON.parse(store.get(storageKeys.savedItems) ?? "{}") as { schemaVersion?: number; data?: unknown; updatedAt?: string };

    expect(raw.schemaVersion).toBe(1);
    expect(raw.updatedAt).toBe("2026-07-01T12:00:00.000Z");
    expect(raw.data).toEqual([{ id: "saved-route" }]);
    expect(readStorageValue(storageKeys.savedItems, [])).toEqual([{ id: "saved-route" }]);
  });

  it("returns the fallback when storage contains malformed JSON", () => {
    store.set(storageKeys.savedItems, "{not-json");

    expect(readStorageValue(storageKeys.savedItems, [])).toEqual([]);
  });

  it("migrates raw legacy keys into the canonical schema-versioned key", () => {
    store.set("meaningful-routes-saved", JSON.stringify([{ id: "legacy-route" }]));

    expect(readStorageValue(storageKeys.savedItems, [], { legacyKeys: ["meaningful-routes-saved"] })).toEqual([{ id: "legacy-route" }]);
    expect(store.has(storageKeys.savedItems)).toBe(true);
    expect(store.has("meaningful-routes-saved")).toBe(false);
  });

  it("does not throw when browser storage is unavailable", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => {
            throw new Error("storage disabled");
          },
          setItem: () => {
            throw new Error("storage disabled");
          },
          removeItem: () => {
            throw new Error("storage disabled");
          }
        }
      }
    });

    expect(readStorageValue(storageKeys.preferences, { units: "metric" })).toEqual({ units: "metric" });
    expect(() => writeStorageValue(storageKeys.preferences, { units: "imperial" })).not.toThrow();
    expect(() => clearStorageValue(storageKeys.preferences)).not.toThrow();
  });
});
