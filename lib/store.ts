"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Settings = {
  /** the colour cue on flashcards — turn it off once you no longer need it */
  hint: boolean;
  /** reveal the pattern name alongside the colour */
  showPatternName: boolean;
};

export const DEFAULT_SETTINGS: Settings = { hint: true, showPatternName: true };

/** Per-verb tally, so the deck can favour what you keep missing. */
export type Progress = Record<string, { seen: number; wrong: number }>;

const NO_PROGRESS: Progress = {};

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * useSyncExternalStore demands a stable snapshot: return the very same object
 * until the stored string actually changes, or React re-renders forever.
 */
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function snapshot<T extends object>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    /* private mode — fall through to the default */
  }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = fallback;
  if (raw) {
    try {
      value = { ...fallback, ...JSON.parse(raw) };
    } catch {
      value = fallback;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

function usePersisted<T extends object>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot(key, fallback),
    () => fallback,
  );

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = snapshot(key, fallback);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* private mode — settings just won't persist */
      }
      listeners.forEach((l) => l());
    },
    [key, fallback],
  );

  return [value, update] as const;
}

export function useSettings() {
  return usePersisted<Settings>("conjugat.settings", DEFAULT_SETTINGS);
}

export function useProgress() {
  const [progress, setProgress] = usePersisted<Progress>(
    "conjugat.progress",
    NO_PROGRESS,
  );

  const record = useCallback(
    (verb: string, correct: boolean) =>
      setProgress((prev) => {
        const cur = prev[verb] ?? { seen: 0, wrong: 0 };
        return {
          ...prev,
          [verb]: { seen: cur.seen + 1, wrong: cur.wrong + (correct ? 0 : 1) },
        };
      }),
    [setProgress],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem("conjugat.progress");
    } catch {
      /* nothing to clear */
    }
    listeners.forEach((l) => l());
  }, []);

  return { progress, record, reset };
}

/**
 * Pick the next verb: verbs you have missed come back sooner, unseen verbs
 * outrank mastered ones, and a little randomness stops it becoming a loop.
 */
export function nextVerb(deck: string[], progress: Progress, avoid?: string): string {
  const pool = deck.filter((v) => v !== avoid);
  if (pool.length === 0) return deck[0] ?? "";
  const weights = pool.map((v) => {
    const p = progress[v];
    if (!p || p.seen === 0) return 3;
    const missRate = p.wrong / p.seen;
    return 1 + missRate * 6 + (p.seen < 3 ? 1 : 0);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
