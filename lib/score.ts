import type { DraftPick, GameState, PlayerId } from "./types";
import { coinsLeft, STARTING_COINS } from "./draft";

export type Totals = [number, number];

/** What settled the round, in the order the rules try them. */
export type Decider = "points" | "coins" | "best-pick" | "draw";

export type Outcome = {
  totals: Totals;
  /** Coins still in hand at the end. */
  coins: Totals;
  /** null only when nothing separates the two players. */
  winner: PlayerId | null;
  margin: number;
  decidedBy: Decider;
};

export function totalsFor(picks: readonly DraftPick[]): Totals {
  const totals: Totals = [0, 0];
  for (const pick of picks) totals[pick.player] += pick.entry.rating;
  return totals;
}

export function spendFor(picks: readonly DraftPick[]): Totals {
  const spend: Totals = [0, 0];
  for (const pick of picks) spend[pick.player] += pick.price;
  return spend;
}

function bestPickRating(picks: readonly DraftPick[], player: PlayerId): number {
  return picks
    .filter((p) => p.player === player)
    .reduce((best, p) => Math.max(best, p.entry.rating), 0);
}

/**
 * Rating totals decide the round. Level totals go to whoever still has coins in
 * hand — thrift is a real skill in an auction, and both players felt it happen.
 * Level on coins too falls back to the boldest correct call.
 *
 * The doc never defines a tiebreak and level totals are likely here: every seed
 * rating sits between 72 and 98, so four-pick totals cluster tightly.
 */
export function outcomeFor(picks: readonly DraftPick[], coins: Totals): Outcome {
  const totals = totalsFor(picks);
  const margin = Math.abs(totals[0] - totals[1]);

  if (totals[0] !== totals[1]) {
    return {
      totals,
      coins,
      winner: totals[0] > totals[1] ? 0 : 1,
      margin,
      decidedBy: "points",
    };
  }

  if (coins[0] !== coins[1]) {
    return {
      totals,
      coins,
      winner: coins[0] > coins[1] ? 0 : 1,
      margin: 0,
      decidedBy: "coins",
    };
  }

  const best = [bestPickRating(picks, 0), bestPickRating(picks, 1)];
  if (best[0] !== best[1]) {
    return {
      totals,
      coins,
      winner: best[0] > best[1] ? 0 : 1,
      margin: 0,
      decidedBy: "best-pick",
    };
  }

  return { totals, coins, winner: null, margin: 0, decidedBy: "draw" };
}

/** Convenience wrapper for a live game state. */
export function outcomeOf(state: GameState): Outcome {
  return outcomeFor(state.picks, [coinsLeft(state, 0), coinsLeft(state, 1)]);
}

export type Awards = {
  /** Highest-rated name on the board. */
  topPick: DraftPick;
  /** Most rating per coin — the bargain of the round. */
  bestValue: DraftPick;
  /** Least rating per coin, once a real price was paid. */
  overpay: DraftPick | null;
};

/**
 * Rating per coin. The +1 keeps an uncontested card from dividing by zero, and
 * correctly treats a free 96 as the best buy available.
 */
function valuePerCoin(pick: DraftPick): number {
  return pick.entry.rating / (pick.price + 1);
}

export function awardsFor(picks: readonly DraftPick[]): Awards | null {
  if (picks.length === 0) return null;

  const topPick = picks.reduce((a, b) => (b.entry.rating > a.entry.rating ? b : a));
  const bestValue = picks.reduce((a, b) => (valuePerCoin(b) > valuePerCoin(a) ? b : a));

  // Only call something an overpay if real money changed hands. A one-coin buy is
  // never an overpay however weak the name.
  const paidFor = picks.filter((p) => p.price >= 2);
  const worst = paidFor.length
    ? paidFor.reduce((a, b) => (valuePerCoin(b) < valuePerCoin(a) ? b : a))
    : null;
  const overpay = worst && worst !== bestValue ? worst : null;

  return { topPick, bestValue, overpay };
}

/** Running total for a player across only the picks revealed so far. */
export function revealedTotals(state: GameState): Totals {
  const shown = state.revealSequence
    .slice(0, state.revealed)
    .map((index) => state.picks[index])
    .filter(Boolean);
  return totalsFor(shown);
}

export { STARTING_COINS };
