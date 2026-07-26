import type { DraftPick, Entry, PlayerId } from "./types";

/**
 * Orders the reveal for suspense rather than for chronology.
 *
 * Two rules, in priority order:
 *  1. Alternate players, so the lead changes hands as often as the picks allow.
 *  2. The pick furthest from the pool's average rating flips last — that is the
 *     one most likely to decide the match, so it is the one worth waiting for.
 *
 * Returns indexes into `picks`.
 */
export function revealSequence(picks: readonly DraftPick[], pool: readonly Entry[]): number[] {
  if (picks.length === 0) return [];

  const mean = pool.reduce((sum, e) => sum + e.rating, 0) / pool.length;
  const drama = (index: number) => Math.abs(picks[index].entry.rating - mean);

  const indexesFor = (player: PlayerId) =>
    picks
      .map((_, index) => index)
      .filter((index) => picks[index].player === player)
      // Ascending, so each player's most dramatic pick sits at the end of their queue.
      .sort((a, b) => drama(a) - drama(b));

  // Whoever owns the single most dramatic pick reveals second in each pair, which
  // lands their queue — and so that pick — in the final slot overall.
  const mostDramatic = picks.reduce(
    (best, _, index) => (drama(index) > drama(best) ? index : best),
    0,
  );
  const secondPlayer = picks[mostDramatic].player;
  const firstPlayer: PlayerId = secondPlayer === 0 ? 1 : 0;

  const firstQueue = indexesFor(firstPlayer);
  const secondQueue = indexesFor(secondPlayer);

  const sequence: number[] = [];
  for (let i = 0; i < Math.max(firstQueue.length, secondQueue.length); i++) {
    if (i < firstQueue.length) sequence.push(firstQueue[i]);
    if (i < secondQueue.length) sequence.push(secondQueue[i]);
  }
  return sequence;
}
