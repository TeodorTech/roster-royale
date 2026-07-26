"use client";

/**
 * A minimal localStorage-backed store shaped for `useSyncExternalStore`.
 *
 * Reading browser storage in a mount effect and calling setState would cause a
 * cascading render, and the server's first paint would disagree with the client's.
 * `useSyncExternalStore` is built for exactly this: React reads the fallback while
 * rendering on the server, then swaps to the real value after hydration.
 */

export type LocalStore<T> = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  read: () => T;
  write: (value: T) => T;
};

export function createLocalStore<T>(
  key: string,
  fallback: T,
  revive: (parsed: unknown) => T | null,
): LocalStore<T> {
  // The raw string last seen in storage, so snapshots stay referentially stable —
  // returning a fresh object every read would spin useSyncExternalStore forever.
  let cachedRaw: string | null | undefined;
  let cached: T = fallback;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (typeof window === "undefined") return fallback;

    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      // Private browsing or a blocked origin — fall back and stop trying to parse.
      return cached;
    }

    if (raw !== cachedRaw) {
      cachedRaw = raw;
      if (raw === null) {
        cached = fallback;
      } else {
        try {
          cached = revive(JSON.parse(raw)) ?? fallback;
        } catch {
          // Hand-edited or half-written value; treat it as absent.
          cached = fallback;
        }
      }
    }
    return cached;
  };

  const write = (value: T): T => {
    cached = value;
    try {
      const raw = JSON.stringify(value);
      cachedRaw = raw;
      window.localStorage.setItem(key, raw);
    } catch {
      // Persistence is a nicety; the in-memory value still drives this session.
      cachedRaw = undefined;
    }
    for (const listener of listeners) listener();
    return value;
  };

  const subscribe = (onChange: () => void) => {
    listeners.add(onChange);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { subscribe, getSnapshot: read, getServerSnapshot: () => fallback, read, write };
}
