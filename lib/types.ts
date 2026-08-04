/** A single draftable name. Matches the on-disk shape of `data/*.json` exactly. */
export type Entry = {
  id: string;
  name: string;
  rating: number;
  rationale: string;
};

/** The shape of a seed file in `data/`. */
export type CategoryFile = {
  category: string;
  label: string;
  icon: string;
  accentColor: string;
  rubric: string;
  note?: string;
  entries: Entry[];
};

export type IconName =
  | "film-reel"
  | "popcorn"
  | "jersey-number"
  | "tv-frame"
  | "car-silhouette"
  | "sword"
  | "dragon"
  | "hero-mask"
  | "crest-shield"
  | "handbag"
  | "custom-spark";

/** A seed file after validation, with display colors derived for the dark board. */
export type Category = {
  id: string;
  label: string;
  icon: IconName;
  /** Accent as authored in the seed file. */
  accent: string;
  /** Accent adjusted to stay legible against the table background. */
  accentOnDark: string;
  rubric: string;
  note?: string;
  entries: Entry[];
};

/**
 * A shelf tile that is not a playable category — the upgrade path. Deliberately
 * a separate type from `Category`: it has no entries, so keeping it out of
 * `CATEGORIES` is what stops `/play` from ever being handed an empty pool.
 */
export type LockedCategory = {
  id: string;
  label: string;
  icon: IconName;
  accent: string;
  /** Stands in for the entry count on the shelf tile. */
  teaser: string;
  /** Where the tile goes instead of `/play`. */
  href: string;
};

/** 0 is the red tray, 1 is the blue tray. Fixed for the life of a match. */
export type PlayerId = 0 | 1;

/**
 * Who is sitting at the table.
 *
 * `duo` is the original pass-and-play auction: two humans bid at each other and
 * the app records what they agree.
 *
 * `solo` is one player against the House. Player 0 is the human and player 1 is
 * the House, which is not an opponent so much as the complement of the human's
 * choices — every card the player passes on lands in the House's tray. That is
 * what lets the reveal, the trays and the scoring run unchanged across both.
 */
export type GameMode = "duo" | "solo";

/**
 * Named `DraftPick` rather than `Pick` so it does not shadow the built-in
 * `Pick<T, K>` utility type.
 */
export type DraftPick = {
  entry: Entry;
  player: PlayerId;
  /** Zero-based position in the draft, 0..(poolSize - 1). */
  order: number;
  /** Coins the winning bid cost. Zero when nobody contested the card. */
  price: number;
};

export type Phase = "drafting" | "revealing" | "results";

export type GameState = {
  categoryId: string;
  seed: string;
  mode: GameMode;
  phase: Phase;
  /** The drawn pool, in display order. Never reordered after the draw. */
  pool: Entry[];
  /** Which player picks at each turn, e.g. [0,1,1,0,0,1,1,0]. */
  turnOrder: PlayerId[];
  picks: DraftPick[];
  /** Reveal sequence, indexes into `picks`. Empty until the reveal begins. */
  revealSequence: number[];
  /** How many of `revealSequence` have been flipped so far. */
  revealed: number;
};
