"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics/react";

import type { Category, DraftPick, GameMode, GameState, Phase, PlayerId } from "@/lib/types";
import {
  canPass,
  canTake,
  coinsLeft,
  createGame,
  currentCard,
  draftIsFull,
  firstSay,
  gameReducer,
  rosterOf,
  slotsLeft,
  ROSTER_SIZE,
  STARTING_COINS,
  YOU,
} from "@/lib/draft";
import {
  awardsFor,
  outcomeFor,
  outcomeOf,
  revealedTotals,
  soloAwardsFor,
  type Decider,
  type SoloAwards,
} from "@/lib/score";
import { makeSeedCode } from "@/lib/rng";
import { recordResult, resetSeries, saveNames, seriesStore, type Series } from "@/lib/series";
import { recordSolo, resetSolo, soloStore, type SoloRecord } from "@/lib/solo";
import { mutedStore, play, setMuted } from "@/lib/sound";
import { CardStage } from "./CardStage";
import { CoinTag } from "./Coins";
import { Tray } from "./Tray";
import { Wordmark } from "./Wordmark";
import { CategoryIcon } from "./CategoryIcon";

/** Pacing of the reveal, in milliseconds. */
const FIRST_FLIP = 520;
const BETWEEN_FLIPS = 1150;
/** The last panel is the one that usually decides it, so it gets a longer beat. */
const BEFORE_LAST_FLIP = 1750;
const AFTER_LAST_FLIP = 1100;

/** Most cards go for something, so the stepper starts at one rather than zero. */
const DEFAULT_BID = 1;

/** How each tiebreak reads once the totals come out level. */
const DECIDER_COPY: Record<Decider, string> = {
  points: "on points",
  coins: "decided on coins in hand",
  "best-pick": "decided on the best single pick",
  draw: "nothing between them",
};

export function Game({
  category,
  seed,
  mode = "duo",
}: {
  category: Category;
  seed?: string;
  mode?: GameMode;
}) {
  // Built on mount rather than during render: the seed is random, and generating
  // it on the server would either mismatch on hydration or bake one pool into the
  // static page. The pool dealing in is the better-looking option anyway.
  const [state, dispatch] = useReducer(reducerOrNull, null);
  const recorded = useRef<string | null>(null);
  /** The bid being recorded for the card on the table. Duo only. */
  const [bid, setBid] = useState(DEFAULT_BID);
  const router = useRouter();
  const solo = mode === "solo";

  // All three live in localStorage, so they are external stores rather than React
  // state — no mount effect, and no server/client disagreement on first paint.
  const series = useSyncExternalStore(
    seriesStore.subscribe,
    seriesStore.getSnapshot,
    seriesStore.getServerSnapshot,
  );
  const soloRecord = useSyncExternalStore(
    soloStore.subscribe,
    soloStore.getSnapshot,
    soloStore.getServerSnapshot,
  );
  const muted = useSyncExternalStore(
    mutedStore.subscribe,
    mutedStore.getSnapshot,
    mutedStore.getServerSnapshot,
  );

  useEffect(() => {
    dispatch({
      type: "NEW",
      game: createGame(category.id, seed ?? makeSeedCode(), category.entries, mode),
    });
    // Keyed on the category's id rather than the object: `category` is
    // deserialised afresh from the RSC payload on every navigation, so depending
    // on it would re-deal the pool each time the URL changes — including the mode
    // toggle below. The entries behind an id are static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, seed, mode]);

  // Solo has no second human to name, and "You takes it" is not a sentence — so
  // the trays are labelled rather than editable.
  const names: [string, string] = solo ? ["You", "The House"] : series.names;
  const phase = state?.phase ?? "drafting";
  const say = state ? firstSay(state) : null;
  const card = state ? currentCard(state) : null;
  const full = state ? draftIsFull(state) : false;

  const purse: [number, number] = useMemo(
    () =>
      state ? [coinsLeft(state, 0), coinsLeft(state, 1)] : [STARTING_COINS, STARTING_COINS],
    [state],
  );

  const rosterFull: [boolean, boolean] = useMemo(
    () =>
      state
        ? [rosterOf(state, 0).length >= ROSTER_SIZE, rosterOf(state, 1).length >= ROSTER_SIZE]
        : [false, false],
    [state],
  );

  const outcome = useMemo(() => (state ? outcomeOf(state) : null), [state]);
  const awards = useMemo(() => (state ? awardsFor(state.picks) : null), [state]);
  const solo0Awards = useMemo(
    () => (state && solo ? soloAwardsFor(state.picks, state.pool) : null),
    [state, solo],
  );

  /** The two solo calls, and how full the player's tray is. */
  const calls = useMemo(
    () =>
      state && solo
        ? { take: canTake(state), pass: canPass(state), held: ROSTER_SIZE - slotsLeft(state, YOU) }
        : { take: false, pass: false, held: 0 },
    [state, solo],
  );

  /** Entry ids flipped so far, driving both trays. */
  const revealedIds = useMemo(() => {
    if (!state) return new Set<string>();
    return new Set(
      state.revealSequence.slice(0, state.revealed).map((index) => state.picks[index].entry.id),
    );
  }, [state]);

  const lastRevealed = useMemo(() => {
    if (!state || state.revealed === 0) return null;
    return state.picks[state.revealSequence[state.revealed - 1]];
  }, [state]);

  const liveTotals = useMemo(() => (state ? revealedTotals(state) : [0, 0]), [state]);

  // --- the reveal cascade ---------------------------------------------------
  useEffect(() => {
    if (!state || state.phase !== "revealing") return;

    const remaining = state.revealSequence.length - state.revealed;

    if (remaining === 0) {
      const timer = setTimeout(() => {
        play("slam", muted);
        dispatch({ type: "ACTION", action: { type: "FINISH" } });
      }, AFTER_LAST_FLIP);
      return () => clearTimeout(timer);
    }

    const delay =
      state.revealed === 0 ? FIRST_FLIP : remaining === 1 ? BEFORE_LAST_FLIP : BETWEEN_FLIPS;

    const timer = setTimeout(() => {
      play("flip", muted);
      dispatch({ type: "ACTION", action: { type: "REVEAL_NEXT" } });
    }, delay);
    return () => clearTimeout(timer);
  }, [state, muted]);

  // Bank the result once per match. Guarded by seed so React's development
  // double-invoke does not score the same game twice.
  useEffect(() => {
    if (!state || state.phase !== "results" || !outcome) return;
    if (recorded.current === state.seed) return;
    recorded.current = state.seed;
    // Two separate books. The series tally is a score between two named humans
    // and resets as tonight's game; losses to the House have no business in it.
    if (state.mode === "solo") recordSolo(outcome.winner);
    else recordResult(outcome.winner);
    track("game_finished", {
      category: state.categoryId,
      mode: state.mode,
      winner: outcome.winner === null ? "draw" : outcome.winner === YOU ? "first" : "second",
    });
    play("win", muted);
  }, [state, outcome, muted]);

  // The stepper is shared between both players, so it clamps to the richer purse
  // and each button decides for itself whether that price is affordable.
  const maxBid = Math.max(purse[0], purse[1]);
  const changeBid = useCallback(
    (value: number) => setBid(Math.max(0, Math.min(maxBid, Math.floor(value)))),
    [maxBid],
  );

  // Solo take and pass are the same append as a duo assignment — one player, no
  // price — so they share the one path that keeps `picks.length` the card cursor.
  const assign = useCallback(
    (player: PlayerId) => {
      // Pageviews alone cannot tell a bounce from a game: this is the first card
      // actually assigned, so it is the moment someone started playing.
      if (state && state.picks.length === 0) {
        track("draft_started", { category: category.id, mode });
      }
      play("pick", muted);
      dispatch({ type: "ACTION", action: { type: "ASSIGN", player, price: solo ? 0 : bid } });
      setBid(DEFAULT_BID);
    },
    [muted, bid, solo, state, category.id, mode],
  );

  const undo = useCallback(() => {
    play("slam", muted);
    dispatch({ type: "ACTION", action: { type: "UNDO" } });
    setBid(DEFAULT_BID);
  }, [muted]);

  const rename = useCallback(
    (player: PlayerId, value: string) => {
      const names: [string, string] = [...series.names];
      names[player] = value;
      saveNames(names);
    },
    [series],
  );

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    // Confirm the unmute audibly — otherwise the button gives no feedback.
    if (!next) play("pick", false);
  };

  const rematch = () => {
    recorded.current = null;
    track("rematch", { category: category.id, mode });
    dispatch({
      type: "NEW",
      game: createGame(category.id, makeSeedCode(), category.entries, mode),
    });
  };

  /**
   * Swapping seats. Only offered before the first card is assigned: the URL
   * change re-runs the mount effect and mints a fresh pool, which is harmless on
   * an empty board and would wreck a round in progress.
   */
  const switchMode = (next: GameMode) => {
    router.replace(`/play?category=${category.id}&mode=${next}`, { scroll: false });
  };

  const revealing = phase === "revealing" || phase === "results";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-4 sm:px-5 sm:pt-6">
      <Header
        category={category}
        mode={mode}
        series={series}
        soloRecord={soloRecord}
        muted={muted}
        onToggleMute={toggleMute}
        onResetSeries={() => (solo ? resetSolo() : resetSeries())}
        onSwitchMode={state && phase === "drafting" && state.picks.length === 0 ? switchMode : undefined}
      />

      <Status
        category={category}
        mode={mode}
        phase={phase}
        full={full}
        names={names}
        lastRevealedRationale={revealing ? lastRevealed?.entry.rationale ?? null : null}
        lastRevealedName={revealing ? lastRevealed?.entry.name ?? null : null}
        lastRevealedPlayer={revealing ? lastRevealed?.player ?? null : null}
        lastRevealedPrice={revealing ? lastRevealed?.price ?? null : null}
        outcome={phase === "results" ? outcome : null}
      />

      {/* One name at a time, face-up. The players negotiate; the app records. */}
      {!revealing && state && card ? (
        <CardStage
          card={card}
          category={category}
          mode={mode}
          remaining={state.pool.length - state.picks.length - 1}
          cardNumber={state.picks.length + 1}
          totalCards={state.pool.length}
          names={names}
          firstSay={say}
          bid={bid}
          onBid={changeBid}
          purse={purse}
          rosterFull={rosterFull}
          onAssign={assign}
          onUndo={state.picks.length > 0 ? undo : undefined}
          canTake={calls.take}
          canPass={calls.pass}
          held={calls.held}
        />
      ) : null}

      {full && phase === "drafting" ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => {
              track("reveal_reached", { category: category.id, mode });
              play("pick", muted);
              dispatch({ type: "ACTION", action: { type: "BEGIN_REVEAL" } });
            }}
            className="moulded rounded-lg bg-brass px-6 py-3 font-display text-sm uppercase tracking-wide text-ink transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 sm:text-base"
          >
            Flip them over
          </button>
        </div>
      ) : null}

      {/* Both trays. They grow into the pool's space once the draft is done. */}
      <section
        aria-label="Rosters"
        className={`mt-auto grid gap-3 pb-6 pt-6 sm:gap-4 ${
          revealing ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {([0, 1] as PlayerId[]).map((player) => (
          <Tray
            key={player}
            player={player}
            name={names[player] || `Player ${player + 1}`}
            picks={state ? rosterOf(state, player) : []}
            category={category}
            // Solo is always the player's turn, so their tray stays on the clock.
            active={phase === "drafting" && (solo ? player === YOU : say === player)}
            score={revealing ? liveTotals[player] : null}
            coins={solo ? null : purse[player]}
            revealedIds={revealedIds}
            plateSize={revealing ? "grid" : "tray"}
            slam={phase === "results" && outcome?.winner !== null && outcome?.winner !== player}
            winner={phase === "results" && outcome?.winner === player}
            onRename={
              !solo && phase === "drafting" ? (value) => rename(player, value) : undefined
            }
          />
        ))}
      </section>

      {phase === "revealing" ? (
        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={() => dispatch({ type: "ACTION", action: { type: "FINISH" } })}
            className="rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-plate/50 transition-colors hover:text-plate"
          >
            Skip to result
          </button>
        </div>
      ) : null}

      {phase === "results" && awards && outcome ? (
        <Results
          awards={awards}
          soloAwards={solo0Awards}
          outcome={outcome}
          names={names}
          category={category}
          mode={mode}
          onRematch={rematch}
          seed={state?.seed ?? ""}
        />
      ) : null}
    </main>
  );
}

/* -------------------------------------------------------------------------- */

type GameAction = { type: "NEW"; game: GameState } | { type: "ACTION"; action: Parameters<typeof gameReducer>[1] };

/** Wraps the pure reducer so the component can also swap in a whole new match. */
function reducerOrNull(state: GameState | null, action: GameAction): GameState | null {
  if (action.type === "NEW") return action.game;
  return state ? gameReducer(state, action.action) : state;
}

function Header({
  category,
  mode,
  series,
  soloRecord,
  muted,
  onToggleMute,
  onResetSeries,
  onSwitchMode,
}: {
  category: Category;
  mode: GameMode;
  series: Series;
  soloRecord: SoloRecord;
  muted: boolean;
  onToggleMute: () => void;
  onResetSeries: () => void;
  /** Absent once the round is under way — swapping seats re-deals the pool. */
  onSwitchMode?: (next: GameMode) => void;
}) {
  const solo = mode === "solo";
  const tally = solo
    ? soloRecord.played > 0
      ? { label: `Reset your record — ${soloRecord.won} of ${soloRecord.played}`, body: <>🔥 {soloRecord.streak}</> }
      : null
    : series.rounds > 0
      ? {
          label: "Reset tonight's tally",
          body: (
            <>
              {series.wins[0]}
              <span className="text-plate/40">&ndash;</span>
              {series.wins[1]}
            </>
          ),
        }
      : null;

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="Back to categories" className="shrink-0">
          <Wordmark size="small" />
        </Link>

        <span
          className="moulded flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: category.accent }}
          title={category.rubric}
        >
          <CategoryIcon name={category.icon} accent="#F0E1BE" className="h-4 w-4 shrink-0" />
          <span className="truncate font-display text-[10px] uppercase text-plate">
            {category.label}
          </span>
        </span>

        <div className="flex shrink-0 items-center gap-2">
          {tally ? (
            <button
              type="button"
              onClick={onResetSeries}
              title={tally.label}
              className="readout moulded-sunken rounded-md px-2 py-1 font-display text-[11px] leading-none text-brass"
            >
              {tally.body}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            className="moulded rounded-md bg-plate/15 px-2 py-1 text-xs leading-none text-plate"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </header>

      {/* A setup control, not a game control — it disappears at the first card. */}
      {onSwitchMode ? (
        <div className="mt-3 flex justify-center">
          <div
            role="group"
            aria-label="Who is playing"
            className="moulded-sunken flex gap-0.5 rounded-full p-0.5"
          >
            {(["solo", "duo"] as GameMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSwitchMode(option)}
                aria-pressed={mode === option}
                className={`rounded-full px-3 py-1 font-display text-[10px] uppercase tracking-wider transition-colors ${
                  mode === option ? "bg-brass text-ink" : "text-plate/50 hover:text-plate"
                }`}
              >
                {option === "solo" ? "Solo" : "2 players"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Status({
  phase,
  mode,
  full,
  names,
  lastRevealedRationale,
  lastRevealedName,
  lastRevealedPlayer,
  lastRevealedPrice,
  outcome,
  category,
}: {
  phase: Phase;
  mode: GameMode;
  full: boolean;
  names: [string, string];
  lastRevealedRationale: string | null;
  lastRevealedName: string | null;
  lastRevealedPlayer: PlayerId | null;
  lastRevealedPrice: number | null;
  outcome: ReturnType<typeof outcomeFor> | null;
  category: Category;
}) {
  const solo = mode === "solo";
  // The card stage already names the card and whose say it is, so this strip stays
  // out of the way during assignment and carries the commentary during the reveal.
  if (phase === "revealing" || phase === "results") {
    return (
      <div className="mt-4 min-h-[4.5rem] text-center" aria-live="polite">
        {lastRevealedName ? (
          <>
            <p className="font-display text-xs uppercase tracking-wide text-brass">
              <span className={lastRevealedPlayer === 0 ? "text-red" : "text-blue"}>
                {names[lastRevealedPlayer ?? 0] || `Player ${(lastRevealedPlayer ?? 0) + 1}`}
              </span>{" "}
              {/* Nothing is bought solo, so the auction verbs would read
                  "got X for nothing" on all eight cards. */}
              {solo
                ? `took ${lastRevealedName}`
                : lastRevealedPrice === 0
                  ? `got ${lastRevealedName} for nothing`
                  : `paid ${lastRevealedPrice} for ${lastRevealedName}`}
            </p>
            <p className="mx-auto mt-1.5 max-w-lg text-balance text-[13px] leading-snug text-plate/65">
              {lastRevealedRationale}
            </p>
          </>
        ) : (
          <p className="font-display text-xs uppercase tracking-[0.15em] text-plate/50">
            Turning them over&hellip;
          </p>
        )}
        {outcome && outcome.decidedBy !== "points" && outcome.decidedBy !== "draw" ? (
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-brass">
            Level on points &mdash; {DECIDER_COPY[outcome.decidedBy]}
          </p>
        ) : null}
      </div>
    );
  }

  if (full) {
    return (
      <div className="mt-4 text-center">
        <p className="font-display text-sm uppercase tracking-wide text-plate">
          {solo ? "Four in, four to the House" : "Both rosters are full"}
        </p>
        <p className="mx-auto mt-1.5 max-w-lg text-balance text-[13px] leading-snug text-plate/55">
          {category.rubric}
        </p>
      </div>
    );
  }

  return (
    <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-wider text-plate/35">
      Ratings stay hidden until every card is assigned
    </p>
  );
}

function Results({
  awards,
  soloAwards,
  outcome,
  names,
  category,
  mode,
  onRematch,
  seed,
}: {
  awards: NonNullable<ReturnType<typeof awardsFor>>;
  soloAwards: SoloAwards | null;
  outcome: NonNullable<ReturnType<typeof outcomeFor>>;
  names: [string, string];
  category: Category;
  mode: GameMode;
  onRematch: () => void;
  seed: string;
}) {
  const solo = mode === "solo";
  const who = (player: PlayerId) => names[player] || `Player ${player + 1}`;

  const lines: { label: string; pick: DraftPick }[] = solo
    ? soloAwards
      ? [
          { label: "Your best call", pick: soloAwards.yourBest },
          { label: "The one you let go", pick: soloAwards.letGo },
        ]
      : []
    : ([
        { label: "Top pick", pick: awards.topPick },
        { label: "Best value", pick: awards.bestValue },
        awards.overpay ? { label: "Overpaid", pick: awards.overpay } : null,
      ].filter(Boolean) as { label: string; pick: DraftPick }[]);

  return (
    <section className="pb-8">
      <div className="crown mb-5 text-center">
        {outcome.winner === null ? (
          <p className="font-display text-xl uppercase tracking-wide text-plate sm:text-2xl">
            Dead heat
          </p>
        ) : (
          <>
            <p className="font-display text-xl uppercase leading-tight tracking-wide sm:text-3xl">
              {/* Second person solo, so the tray label never lands in the verb:
                  interpolating "You" here would read "You takes it". */}
              <span className={outcome.winner === YOU ? "text-red" : "text-blue"}>
                {solo ? (outcome.winner === YOU ? "You" : "The House") : who(outcome.winner)}
              </span>
              <span className="text-plate">
                {solo && outcome.winner === YOU ? " take it" : " takes it"}
              </span>
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-brass">
              {outcome.totals[0]} &ndash; {outcome.totals[1]}
              {outcome.decidedBy === "points"
                ? ` · by ${outcome.margin}`
                : ` · ${DECIDER_COPY[outcome.decidedBy]}`}
            </p>
          </>
        )}

        {solo ? (
          // Beating the House is close to a coin toss, so the win alone says
          // little. This is the number with a ceiling worth chasing.
          soloAwards ? (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-plate/55">
              Perfect was {soloAwards.perfect} &middot;{" "}
              {soloAwards.offPerfect === 0
                ? "you nailed it"
                : `you were ${soloAwards.offPerfect} off`}{" "}
              &middot; {soloAwards.ofTopFour} of the best {ROSTER_SIZE}
            </p>
          ) : null
        ) : (
          /* Coins in hand at the close — the tiebreak, so it's always worth showing. */
          <div className="mt-3 flex items-center justify-center gap-2">
            <CoinTag amount={outcome.coins[0]} label={who(0)} tone="quiet" />
            <CoinTag amount={outcome.coins[1]} label={who(1)} tone="quiet" />
          </div>
        )}
      </div>

      <ul
        className={`mx-auto grid max-w-2xl gap-2 ${solo ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
      >
        {lines.map(({ label, pick }) => (
          <li key={label} className="moulded plate relative overflow-hidden rounded-md px-3 py-2">
            <span
              className="absolute inset-y-0 left-0 w-1.5 border-r-[3px] border-ink"
              style={{ background: pick.player === 0 ? "var(--color-red)" : "var(--color-blue)" }}
              aria-hidden
            />
            <p className="relative z-10 pl-2 font-display text-[9px] uppercase tracking-[0.15em] text-ink/45">
              {label}
            </p>
            <p className="relative z-10 pl-2 text-[13px] font-extrabold leading-tight text-ink">
              {pick.entry.name}
            </p>
            <p className="relative z-10 flex items-center gap-1.5 pl-2 text-[10px] font-bold uppercase text-ink/45">
              {who(pick.player)} &middot; rated {pick.entry.rating}
              {solo ? null : <> for {pick.price === 0 ? "free" : `${pick.price}`}</>}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="moulded rounded-lg bg-brass px-5 py-2.5 font-display text-sm uppercase tracking-wide text-ink transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
        >
          {solo ? "Play again" : "Rematch"}
        </button>
        {/* Just after a result is when someone turns to whoever is next to them. */}
        {solo ? (
          <Link
            href={`/play?category=${category.id}&mode=duo`}
            className="moulded rounded-lg bg-plate/15 px-5 py-2.5 font-display text-sm uppercase tracking-wide text-plate transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            Play a friend
          </Link>
        ) : null}
        <Link
          href="/"
          className="moulded rounded-lg bg-plate/15 px-5 py-2.5 font-display text-sm uppercase tracking-wide text-plate transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
        >
          Switch category
        </Link>
      </div>

      <p className="mt-5 text-center text-[10px] uppercase tracking-[0.15em] text-plate/30">
        {category.label} &middot; pool {seed}
      </p>
    </section>
  );
}
