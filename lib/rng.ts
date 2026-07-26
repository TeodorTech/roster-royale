/**
 * Seeded randomness. Every shuffle and draw in the game routes through here, so
 * a match is fully reproducible from its seed code alone — which is what makes
 * a shareable result link possible later without storing anything server-side.
 */

/** Crockford-style alphabet: no 0/O/1/I/L to confuse anyone reading a code aloud. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export type Rng = () => number;

/** A fresh, human-speakable seed code. Unseeded on purpose — this starts a match. */
export function makeSeedCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function isSeedCode(value: string): boolean {
  return value.length > 0 && value.length <= 12 && [...value].every((c) => ALPHABET.includes(c));
}

/** FNV-1a. Small, stable, and enough to spread short codes across the 32-bit space. */
function hashCode(code: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — 32-bit PRNG, ~10 lines, good enough distribution for a card game. */
export function createRng(seed: string | number): Rng {
  let state = (typeof seed === "string" ? hashCode(seed) : seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates on a copy. Never mutates the input. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` distinct items, or everything (shuffled) if there aren't enough. */
export function sample<T>(items: readonly T[], count: number, rng: Rng): T[] {
  return shuffle(items, rng).slice(0, Math.min(count, items.length));
}
