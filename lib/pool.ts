import type { Entry } from "./types";
import { sample, shuffle, type Rng } from "./rng";

/**
 * Draws the shared pool for a round.
 *
 * A uniform random draw from 50 names regularly produces a dud: eight names all
 * within three rating points of each other (no trade-offs, anticlimactic reveal)
 * or one obvious giant among seven also-rans (the draft decides itself on pick
 * one). So the draw is stratified — the category is split into rating bands by
 * *position*, not by absolute score, and a fixed number comes from each band.
 *
 * Position-based banding matters here: the seed data is all famous names, so
 * ratings cluster in the 70s–90s. Absolute thresholds would put every entry in
 * one band; sorted position always yields a real spread.
 */

export type TierCounts = { elite: number; mid: number; low: number };

/** Derived from pool size rather than hardcoded, so a 10-name pool needs no new code. */
export function tierCounts(poolSize: number): TierCounts {
  const elite = Math.max(1, Math.round(poolSize * 0.25));
  const low = Math.max(1, Math.round(poolSize * 0.375));
  const mid = Math.max(0, poolSize - elite - low);
  return { elite, mid, low };
}

export function drawPool(entries: readonly Entry[], poolSize: number, rng: Rng): Entry[] {
  if (entries.length <= poolSize) return shuffle(entries, rng);

  const ranked = [...entries].sort((a, b) => b.rating - a.rating);
  const third = Math.floor(ranked.length / 3);
  const bands = [
    ranked.slice(0, third), // elite
    ranked.slice(third, third * 2), // mid
    ranked.slice(third * 2), // low
  ];
  const { elite, mid, low } = tierCounts(poolSize);
  const wanted = [elite, mid, low];

  const drawn: Entry[] = [];
  bands.forEach((band, i) => {
    drawn.push(...sample(band, wanted[i], rng));
  });

  // A band can come up short on a small category; backfill from whatever is left
  // so the pool is always exactly poolSize.
  if (drawn.length < poolSize) {
    const taken = new Set(drawn.map((e) => e.id));
    const rest = ranked.filter((e) => !taken.has(e.id));
    drawn.push(...sample(rest, poolSize - drawn.length, rng));
  }

  // Shuffle so the grid never reads as "strongest in the top-left".
  return shuffle(drawn.slice(0, poolSize), rng);
}
