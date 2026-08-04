import type { DraftPick, Entry, GameMode, GameState, PlayerId } from "./types";
import { createRng } from "./rng";
import { drawPool } from "./pool";
import { revealSequence } from "./reveal";

export const POOL_SIZE = 8;
export const ROSTER_SIZE = 4;

/**
 * Solo's forcing rules depend on `POOL_SIZE === ROSTER_SIZE * 2` — see `canPass`.
 * `logic.check.ts` asserts it so a future pool-size change fails loudly in Node
 * rather than silently deadlocking a solo round in the browser.
 */

/** Each player's purse at the start of a round. Duo only; solo plays for free. */
export const STARTING_COINS = 20;

/** Solo seating. Stated once here so the polarity can never be inverted by hand. */
export const YOU: PlayerId = 0;
export const HOUSE: PlayerId = 1;

/** Narrows a `?mode=` value. Anything unrecognised is the original two-player game. */
export function parseMode(value: string | undefined): GameMode {
  return value === "solo" ? "solo" : "duo";
}

/**
 * Snake order for two players: each round reverses, so neither player owns every
 * first say. Generated from roster size rather than written out, so changing
 * ROSTER_SIZE is the only edit a longer round needs.
 *
 * ROSTER_SIZE 4 yields [0,1,1,0,0,1,1,0].
 */
export function snakeOrder(rosterSize: number): PlayerId[] {
  const order: PlayerId[] = [];
  for (let round = 0; round < rosterSize; round++) {
    order.push(...(round % 2 === 0 ? ([0, 1] as const) : ([1, 0] as const)));
  }
  return order;
}

export function createGame(
  categoryId: string,
  seed: string,
  entries: readonly Entry[],
  mode: GameMode = "duo",
): GameState {
  const rng = createRng(seed);
  return {
    categoryId,
    seed,
    mode,
    phase: "drafting",
    // Surfacing order: pool[0] comes up first, pool[7] last.
    pool: drawPool(entries, POOL_SIZE, rng),
    // Snake order is meaningless solo — the player decides every card — and an
    // empty order makes `firstSay` return null throughout, so the "X opens"
    // prompt and the tray's turn glow fall away without a special case.
    turnOrder: mode === "solo" ? [] : snakeOrder(ROSTER_SIZE),
    picks: [],
    revealSequence: [],
    revealed: 0,
  };
}

/** The name currently on the table, or null once every card has been assigned. */
export function currentCard(state: GameState): Entry | null {
  return state.picks.length < state.pool.length ? state.pool[state.picks.length] : null;
}

/**
 * Who has first say on the card showing.
 *
 * Advisory only. The players settle it out loud and the app records whatever they
 * agree, so this never restricts which button works — it just answers "whose call
 * is it?" when nobody remembers.
 */
export function firstSay(state: GameState): PlayerId | null {
  return state.picks.length < state.turnOrder.length ? state.turnOrder[state.picks.length] : null;
}

export function rosterOf(state: GameState, player: PlayerId): DraftPick[] {
  return state.picks.filter((p) => p.player === player);
}

export function spentBy(state: GameState, player: PlayerId): number {
  return rosterOf(state, player).reduce((sum, pick) => sum + pick.price, 0);
}

/**
 * Coins still in hand. Derived from the assignments rather than tracked
 * separately, so the purse can never drift out of step with the record — and undo
 * refunds a bid for free.
 */
export function coinsLeft(state: GameState, player: PlayerId): number {
  return STARTING_COINS - spentBy(state, player);
}

/**
 * Whether this player can take the card at this price. Two limits: a roster stops
 * at four, and nobody can pay more than they are holding.
 */
export function canAssign(state: GameState, player: PlayerId, price = 0): boolean {
  return (
    state.phase === "drafting" &&
    rosterOf(state, player).length < ROSTER_SIZE &&
    price >= 0 &&
    price <= coinsLeft(state, player)
  );
}

export function isTaken(state: GameState, entryId: string): boolean {
  return state.picks.some((p) => p.entry.id === entryId);
}

/* --- solo ----------------------------------------------------------------- */

/** Cards still to come, including the one on the table. */
export function cardsLeft(state: GameState): number {
  return state.pool.length - state.picks.length;
}

/** Empty recesses in this player's tray. */
export function slotsLeft(state: GameState, player: PlayerId): number {
  return ROSTER_SIZE - rosterOf(state, player).length;
}

/** Whether the solo player can claim the card showing. */
export function canTake(state: GameState): boolean {
  return (
    state.phase === "drafting" && currentCard(state) !== null && slotsLeft(state, YOU) > 0
  );
}

/**
 * Whether the solo player can let the card showing go to the House.
 *
 * The two limits are the same limit. Because the pool is exactly two rosters,
 * `cardsLeft === slotsLeft(YOU) + slotsLeft(HOUSE)`, so the House running out of
 * room is precisely the moment the player needs every card that is left. Both
 * are spelled out because the equivalence is an arithmetic accident of the sizes,
 * not something either condition states on its own.
 */
export function canPass(state: GameState): boolean {
  return (
    state.phase === "drafting" &&
    currentCard(state) !== null &&
    slotsLeft(state, HOUSE) > 0 &&
    cardsLeft(state) > slotsLeft(state, YOU)
  );
}

export type Action =
  | { type: "ASSIGN"; player: PlayerId; price: number }
  | { type: "UNDO" }
  | { type: "BEGIN_REVEAL" }
  | { type: "REVEAL_NEXT" }
  | { type: "FINISH" };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ASSIGN": {
      if (state.phase !== "drafting") return state;

      // Solo plays for free. Forced here rather than trusted from the caller: the
      // solo awards and the hidden coin UI all rest on every price being zero, and
      // a stale render must not be able to smuggle a bid into the record.
      const price = state.mode === "solo" ? 0 : Math.floor(action.price);

      const allowed =
        state.mode === "solo"
          ? action.player === YOU
            ? canTake(state)
            : canPass(state)
          : Number.isFinite(price) && canAssign(state, action.player, price);
      if (!allowed) return state;

      const entry = currentCard(state);
      if (!entry) return state;

      return {
        ...state,
        picks: [
          ...state.picks,
          { entry, player: action.player, order: state.picks.length, price },
        ],
      };
    }

    // A mis-tap would otherwise corrupt the record for the rest of the round, and
    // the card it belongs to is right there on the table.
    case "UNDO": {
      if (state.phase !== "drafting" || state.picks.length === 0) return state;
      return { ...state, picks: state.picks.slice(0, -1) };
    }

    case "BEGIN_REVEAL": {
      if (state.phase !== "drafting" || !draftIsFull(state)) return state;
      return {
        ...state,
        phase: "revealing",
        revealSequence: revealSequence(state.picks, state.pool),
        revealed: 0,
      };
    }

    case "REVEAL_NEXT": {
      if (state.phase !== "revealing") return state;
      return { ...state, revealed: Math.min(state.revealed + 1, state.revealSequence.length) };
    }

    case "FINISH": {
      if (state.phase !== "revealing") return state;
      return { ...state, phase: "results", revealed: state.revealSequence.length };
    }

    default:
      return state;
  }
}

export function draftIsFull(state: GameState): boolean {
  return state.picks.length >= state.pool.length;
}
