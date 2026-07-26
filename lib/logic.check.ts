import assert from "node:assert/strict";

import { createRng, shuffle, makeSeedCode, isSeedCode } from "./rng";
import { drawPool, tierCounts } from "./pool";
import {
  snakeOrder,
  createGame,
  gameReducer,
  currentCard,
  firstSay,
  canAssign,
  coinsLeft,
  spentBy,
  rosterOf,
  draftIsFull,
  ROSTER_SIZE,
  STARTING_COINS,
} from "./draft";
import { outcomeFor, totalsFor, spendFor, awardsFor } from "./score";
import type { PlayerId } from "./types";

import { readableOn, contrastRatio } from "./color";
import type { Entry } from "./types";

const results: string[] = [];
const check = (name: string, fn: () => void) => {
  try {
    fn();
    results.push(`  ok  ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name}\n      ${(error as Error).message.split("\n")[0]}`);
    process.exitCode = 1;
  }
};

// Stand-in for a category: 50 entries in the same narrow, top-heavy band as the
// real seed data (73..96), so the checks exercise realistic inputs.
const entries: Entry[] = Array.from({ length: 50 }, (_, i) => ({
  id: `e-${String(i).padStart(3, "0")}`,
  name: `Name ${i}`,
  rating: 96 - Math.floor((i / 49) * 23),
  rationale: "why",
}));

check("snake order is P1,P2,P2,P1,P1,P2,P2,P1", () => {
  assert.deepEqual(snakeOrder(4), [0, 1, 1, 0, 0, 1, 1, 0]);
});

check("snake order stays balanced at other roster sizes", () => {
  for (const size of [1, 2, 3, 5, 8]) {
    const order = snakeOrder(size);
    assert.equal(order.length, size * 2);
    assert.equal(order.filter((p) => p === 0).length, size);
    assert.equal(order.filter((p) => p === 1).length, size);
  }
});

check("tier counts for an 8-pool are 2 elite / 3 mid / 3 low", () => {
  assert.deepEqual(tierCounts(8), { elite: 2, mid: 3, low: 3 });
});

check("tier counts always sum to pool size", () => {
  for (const size of [4, 6, 8, 10, 12, 16]) {
    const { elite, mid, low } = tierCounts(size);
    assert.equal(elite + mid + low, size, `pool of ${size}`);
  }
});

check("drawn pool is the right size and has no duplicates", () => {
  for (let i = 0; i < 200; i++) {
    const pool = drawPool(entries, 8, createRng(`seed-${i}`));
    assert.equal(pool.length, 8);
    assert.equal(new Set(pool.map((e) => e.id)).size, 8);
  }
});

check("stratified draw always spans a real rating spread", () => {
  // The point of stratifying: never eight names within a couple of points.
  let worstSpread = Infinity;
  for (let i = 0; i < 500; i++) {
    const pool = drawPool(entries, 8, createRng(`spread-${i}`));
    const ratings = pool.map((e) => e.rating);
    worstSpread = Math.min(worstSpread, Math.max(...ratings) - Math.min(...ratings));
  }
  assert.ok(worstSpread >= 10, `worst spread was only ${worstSpread}`);
});

check("draw is reproducible from its seed and varies across seeds", () => {
  const a = drawPool(entries, 8, createRng("ABC123")).map((e) => e.id);
  const b = drawPool(entries, 8, createRng("ABC123")).map((e) => e.id);
  const c = drawPool(entries, 8, createRng("XYZ789")).map((e) => e.id);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

check("small categories degrade gracefully", () => {
  const tiny = entries.slice(0, 5);
  const pool = drawPool(tiny, 8, createRng("tiny"));
  assert.equal(pool.length, 5);
});

check("shuffle preserves membership", () => {
  const shuffled = shuffle(entries, createRng("s"));
  assert.equal(shuffled.length, entries.length);
  assert.deepEqual(
    shuffled.map((e) => e.id).sort(),
    entries.map((e) => e.id).sort(),
  );
});

check("seed codes round-trip the validator", () => {
  for (let i = 0; i < 50; i++) assert.ok(isSeedCode(makeSeedCode()));
  assert.equal(isSeedCode("abc"), false, "lowercase rejected");
  assert.equal(isSeedCode("OOPS01"), false, "confusable characters rejected");
});

// --- a full simulated round -------------------------------------------------

type Game = ReturnType<typeof createGame>;

/**
 * The app records an auction rather than running one: the humans bid at each other
 * in the room, so `decide` stands in for who won and what they paid. Prices are
 * clamped to what the winner is actually holding, mirroring the disabled button.
 */
function playRound(seed: string, decide: (state: Game) => { player: PlayerId; price: number }) {
  let state = createGame("test", seed, entries);
  let guard = 0;
  while (!draftIsFull(state) && guard++ < 50) {
    const wanted = decide(state);
    // Fall through to whoever has room, mirroring the disabled button in the UI.
    const player =
      rosterOf(state, wanted.player).length < ROSTER_SIZE
        ? wanted.player
        : ((1 - wanted.player) as PlayerId);
    const price = Math.min(wanted.price, coinsLeft(state, player));
    state = gameReducer(state, { type: "ASSIGN", player, price });
  }
  return state;
}

/** Follows the advisory snake order at a coin a card — the common case in the room. */
const bySnake = (state: Game) => ({ player: firstSay(state) ?? 0, price: 1 });

check("a full round assigns every card and fills both rosters", () => {
  const state = playRound("match-1", bySnake);
  assert.equal(state.picks.length, 8);
  assert.equal(rosterOf(state, 0).length, 4);
  assert.equal(rosterOf(state, 1).length, 4);
  assert.equal(new Set(state.picks.map((p) => p.entry.id)).size, 8);
});

check("cards surface in pool order, one at a time", () => {
  let state = createGame("test", "order", entries);
  for (let i = 0; i < 8; i++) {
    assert.equal(currentCard(state)?.id, state.pool[i].id, `card ${i + 1}`);
    state = gameReducer(state, { type: "ASSIGN", player: (i % 2) as PlayerId, price: 1 });
  }
  assert.equal(currentCard(state), null, "nothing left on the table");
});

check("assignment is free — either player can take any card", () => {
  // Player 1 wins the first four regardless of whose say it was.
  let state = createGame("test", "greedy", entries);
  for (let i = 0; i < 4; i++) state = gameReducer(state, { type: "ASSIGN", player: 0, price: 1 });
  assert.equal(rosterOf(state, 0).length, 4);
  assert.equal(rosterOf(state, 1).length, 0);
});

check("a roster stops at four and refuses further cards", () => {
  let state = createGame("test", "cap", entries);
  for (let i = 0; i < ROSTER_SIZE; i++) {
    state = gameReducer(state, { type: "ASSIGN", player: 0, price: 1 });
  }
  assert.equal(canAssign(state, 0), false);
  const blocked = gameReducer(state, { type: "ASSIGN", player: 0, price: 1 });
  assert.equal(blocked, state, "state should be returned unchanged");
  assert.equal(rosterOf(blocked, 0).length, 4);
});

check("a round still completes after one player fills up early", () => {
  const state = playRound("lopsided", () => ({ player: 0, price: 1 }));
  assert.equal(state.picks.length, 8);
  assert.equal(rosterOf(state, 0).length, 4);
  assert.equal(rosterOf(state, 1).length, 4);
});

check("first say follows the snake order and is advisory only", () => {
  const state = createGame("test", "say", entries);
  assert.equal(firstSay(state), 0);
  // Handing the card to the other player does not break the sequence.
  const after = gameReducer(state, { type: "ASSIGN", player: 1, price: 1 });
  assert.equal(firstSay(after), 1, "second card's say still comes from the snake order");
});

// --- coins ------------------------------------------------------------------

check("both players start with a full purse", () => {
  const state = createGame("test", "purse", entries);
  assert.equal(coinsLeft(state, 0), STARTING_COINS);
  assert.equal(coinsLeft(state, 1), STARTING_COINS);
});

check("a winning bid comes out of that player's purse only", () => {
  let state = createGame("test", "spend", entries);
  state = gameReducer(state, { type: "ASSIGN", player: 0, price: 7 });
  assert.equal(coinsLeft(state, 0), STARTING_COINS - 7);
  assert.equal(coinsLeft(state, 1), STARTING_COINS, "the other purse is untouched");
  assert.equal(spentBy(state, 0), 7);
});

check("nobody can bid more than they are holding", () => {
  const state = createGame("test", "broke", entries);
  const tooMuch = gameReducer(state, { type: "ASSIGN", player: 0, price: STARTING_COINS + 1 });
  assert.equal(tooMuch, state, "state should be returned unchanged");
  assert.equal(canAssign(state, 0, STARTING_COINS), true, "the whole purse is allowed");
  assert.equal(canAssign(state, 0, STARTING_COINS + 1), false);
});

check("a card can be won for nothing", () => {
  let state = createGame("test", "free", entries);
  state = gameReducer(state, { type: "ASSIGN", player: 1, price: 0 });
  assert.equal(state.picks.length, 1);
  assert.equal(state.picks[0].price, 0);
  assert.equal(coinsLeft(state, 1), STARTING_COINS);
});

check("negative and fractional bids are refused or floored", () => {
  const state = createGame("test", "odd", entries);
  assert.equal(gameReducer(state, { type: "ASSIGN", player: 0, price: -3 }), state);
  const floored = gameReducer(state, { type: "ASSIGN", player: 0, price: 4.8 });
  assert.equal(floored.picks[0].price, 4, "fractional bids floor to whole coins");
});

check("a spent-out player can still be given cards for free", () => {
  let state = createGame("test", "skint", entries);
  state = gameReducer(state, { type: "ASSIGN", player: 0, price: STARTING_COINS });
  assert.equal(coinsLeft(state, 0), 0);
  assert.equal(canAssign(state, 0, 1), false, "cannot bid a coin they do not have");
  assert.equal(canAssign(state, 0, 0), true);
  state = gameReducer(state, { type: "ASSIGN", player: 0, price: 0 });
  assert.equal(rosterOf(state, 0).length, 2);
});

check("purse never goes negative across a full round of heavy bidding", () => {
  const state = playRound("heavy", (s) => ({ player: firstSay(s) ?? 0, price: 9 }));
  assert.ok(coinsLeft(state, 0) >= 0, `player 1 ended on ${coinsLeft(state, 0)}`);
  assert.ok(coinsLeft(state, 1) >= 0, `player 2 ended on ${coinsLeft(state, 1)}`);
  assert.equal(state.picks.length, 8);
});

// --- undo -------------------------------------------------------------------

check("undo removes the last assignment and puts the card back", () => {
  let state = createGame("test", "undo", entries);
  const first = currentCard(state)!;
  state = gameReducer(state, { type: "ASSIGN", player: 1, price: 1 });
  assert.equal(currentCard(state)?.id, state.pool[1].id);

  state = gameReducer(state, { type: "UNDO" });
  assert.equal(state.picks.length, 0);
  assert.equal(currentCard(state)?.id, first.id, "the same card is back on the table");
});

check("undo refunds the bid", () => {
  let state = createGame("test", "refund", entries);
  state = gameReducer(state, { type: "ASSIGN", player: 0, price: 12 });
  assert.equal(coinsLeft(state, 0), STARTING_COINS - 12);
  state = gameReducer(state, { type: "UNDO" });
  assert.equal(coinsLeft(state, 0), STARTING_COINS);
});

check("undo on an empty board is a no-op", () => {
  const state = createGame("test", "undo-empty", entries);
  assert.equal(gameReducer(state, { type: "UNDO" }), state);
});

check("undo frees a capped roster back up", () => {
  let state = createGame("test", "undo-cap", entries);
  for (let i = 0; i < ROSTER_SIZE; i++) {
    state = gameReducer(state, { type: "ASSIGN", player: 0, price: 1 });
  }
  assert.equal(canAssign(state, 0), false);
  state = gameReducer(state, { type: "UNDO" });
  assert.equal(canAssign(state, 0), true);
});

check("undo is refused once the reveal has started", () => {
  const full = playRound("undo-late", bySnake);
  const revealing = gameReducer(full, { type: "BEGIN_REVEAL" });
  assert.equal(gameReducer(revealing, { type: "UNDO" }), revealing);
});

check("reveal cannot begin before every card is assigned", () => {
  const state = createGame("test", "early", entries);
  assert.equal(gameReducer(state, { type: "BEGIN_REVEAL" }).phase, "drafting");
});

check("firstSay is null once every card is assigned", () => {
  assert.equal(firstSay(playRound("match-3", bySnake)), null);
});

// --- reveal ordering --------------------------------------------------------

check("reveal sequence covers every pick exactly once", () => {
  const state = gameReducer(playRound("reveal-1", bySnake), { type: "BEGIN_REVEAL" });
  assert.equal(state.revealSequence.length, 8);
  assert.deepEqual([...state.revealSequence].sort((x, y) => x - y), [0, 1, 2, 3, 4, 5, 6, 7]);
});

check("reveal alternates players", () => {
  for (let i = 0; i < 100; i++) {
    const state = gameReducer(playRound(`alt-${i}`, bySnake), { type: "BEGIN_REVEAL" });
    const players = state.revealSequence.map((index) => state.picks[index].player);
    for (let p = 1; p < players.length; p++) {
      assert.notEqual(players[p], players[p - 1], `seed alt-${i} repeated a player`);
    }
  }
});

check("the most dramatic pick reveals last", () => {
  for (let i = 0; i < 100; i++) {
    const state = gameReducer(playRound(`drama-${i}`, bySnake), { type: "BEGIN_REVEAL" });
    const mean = state.pool.reduce((s, e) => s + e.rating, 0) / state.pool.length;
    const drama = (index: number) => Math.abs(state.picks[index].entry.rating - mean);
    const last = state.revealSequence[state.revealSequence.length - 1];
    const maxDrama = Math.max(...state.revealSequence.map(drama));
    assert.equal(drama(last), maxDrama, `seed drama-${i}`);
  }
});

check("revealing past the end clamps", () => {
  let state = gameReducer(playRound("clamp", bySnake), { type: "BEGIN_REVEAL" });
  for (let i = 0; i < 20; i++) state = gameReducer(state, { type: "REVEAL_NEXT" });
  assert.equal(state.revealed, 8);
});

// --- scoring ----------------------------------------------------------------

const pick = (player: 0 | 1, rating: number, order: number, price = 1) => ({
  entry: { id: `p${order}`, name: `n${order}`, rating, rationale: "r" },
  player,
  order,
  price,
});

/** Purses after an even coin each, used where the tiebreak shouldn't fire. */
const level: [number, number] = [10, 10];

check("totals sum per player", () => {
  const picks = [pick(0, 90, 0), pick(1, 80, 1), pick(1, 85, 2), pick(0, 75, 3)];
  assert.deepEqual(totalsFor(picks), [165, 165]);
});

check("spend sums per player", () => {
  const picks = [pick(0, 90, 0, 5), pick(1, 80, 1, 3), pick(0, 85, 2, 2)];
  assert.deepEqual(spendFor(picks), [7, 3]);
});

check("higher total wins", () => {
  const outcome = outcomeFor([pick(0, 90, 0), pick(1, 80, 1)], level);
  assert.equal(outcome.winner, 0);
  assert.equal(outcome.margin, 10);
  assert.equal(outcome.decidedBy, "points");
});

check("level totals fall to coins in hand", () => {
  // Same 170 apiece, but player 2 got there with four coins still in pocket.
  const picks = [pick(0, 90, 0), pick(0, 80, 1), pick(1, 85, 2), pick(1, 85, 3)];
  const outcome = outcomeFor(picks, [1, 4]);
  assert.equal(outcome.winner, 1);
  assert.equal(outcome.decidedBy, "coins");
  assert.equal(outcome.margin, 0);
});

check("level on totals and coins falls to the best single pick", () => {
  // 96+74 vs 85+85 — same total, same purse, so the boldest correct call takes it.
  const picks = [pick(0, 96, 0), pick(0, 74, 1), pick(1, 85, 2), pick(1, 85, 3)];
  const outcome = outcomeFor(picks, level);
  assert.equal(outcome.winner, 0);
  assert.equal(outcome.decidedBy, "best-pick");
});

check("identical totals, coins and best pick is a draw", () => {
  const picks = [pick(0, 90, 0), pick(0, 80, 1), pick(1, 90, 2), pick(1, 80, 3)];
  const outcome = outcomeFor(picks, level);
  assert.equal(outcome.winner, null);
  assert.equal(outcome.decidedBy, "draw");
});

check("coins never override a points win", () => {
  // Player 1 wins on points despite having spent everything.
  const outcome = outcomeFor([pick(0, 96, 0), pick(1, 80, 1)], [0, 20]);
  assert.equal(outcome.winner, 0);
  assert.equal(outcome.decidedBy, "points");
});

check("awards name the top pick and the best value", () => {
  // A 73 for free beats an 88 at six coins on rating per coin.
  const picks = [pick(0, 96, 0, 12), pick(1, 88, 1, 6), pick(1, 80, 2, 4), pick(0, 73, 3, 0)];
  const awards = awardsFor(picks)!;
  assert.equal(awards.topPick.entry.rating, 96);
  assert.equal(awards.bestValue.entry.rating, 73, "the free card is the bargain");
});

check("an uncontested card never divides by zero", () => {
  const awards = awardsFor([pick(0, 90, 0, 0), pick(1, 91, 1, 9)])!;
  assert.equal(awards.bestValue.entry.rating, 90);
  assert.ok(Number.isFinite(awards.bestValue.entry.rating / (awards.bestValue.price + 1)));
});

check("overpay only fires when a real price was paid", () => {
  const dear = [pick(0, 96, 0, 1), pick(1, 74, 1, 11), pick(0, 90, 2, 2), pick(1, 85, 3, 3)];
  assert.equal(awardsFor(dear)!.overpay?.entry.rating, 74, "11 coins for a 74");

  // Everything went cheap, so nobody overpaid.
  const cheap = [pick(0, 96, 0, 1), pick(1, 74, 1, 0), pick(0, 90, 2, 1), pick(1, 85, 3, 0)];
  assert.equal(awardsFor(cheap)!.overpay, null);
});

check("overpay is never also the best value", () => {
  const single = [pick(0, 80, 0, 5)];
  const awards = awardsFor(single)!;
  assert.equal(awards.bestValue.order, 0);
  assert.equal(awards.overpay, null, "the only pick cannot be both");
});

// --- accent legibility ------------------------------------------------------

const TABLE = "#3B2A22";

check("every seed accent is legible on the table background", () => {
  const accents = {
    actors: "#C8102E",
    movies: "#F2A900",
    athletes: "#0057B8",
    tvSeries: "#00875A",
    carBrands: "#1D1D1F",
    gotCharacters: "#6B0F1A",
    hotdDragons: "#C1440E",
    marvelHeroes: "#ED1D24",
    heritageClubs: "#2C5F2D",
  };
  for (const [name, hex] of Object.entries(accents)) {
    const ratio = contrastRatio(readableOn(hex, TABLE), TABLE);
    assert.ok(ratio >= 3.2, `${name}: ${ratio.toFixed(2)}:1`);
  }
});

check("accents that already pass are left untouched", () => {
  assert.equal(readableOn("#F2A900", TABLE), "#F2A900");
});

check("the near-black car accent gets lightened", () => {
  assert.notEqual(readableOn("#1D1D1F", TABLE), "#1D1D1F");
});

console.log(results.join("\n"));
console.log(
  `\n${results.filter((r) => r.startsWith("  ok")).length}/${results.length} checks passed`,
);
