"use client";

import type { PlayerId } from "./types";
import { YOU } from "./draft";
import { createLocalStore } from "./store";

/**
 * The solo record, kept apart from the two-player series on purpose.
 *
 * `series` is a tally between two named humans — "Teo 2, Alex 1", reset as
 * tonight's score. Folding losses to the House into it would quietly corrupt a
 * real night's game, so solo counts its own rounds. localStorage only, like the
 * series: no accounts, nothing leaves the device.
 */

const KEY = "roster-royale.solo.v1";

export type SoloRecord = {
  played: number;
  won: number;
  /** Wins in a row right now. Any result that is not a win breaks it. */
  streak: number;
  /** Longest streak so far. */
  best: number;
};

export const EMPTY_SOLO: SoloRecord = { played: 0, won: 0, streak: 0, best: 0 };

function revive(parsed: unknown): SoloRecord | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const value = parsed as Partial<SoloRecord>;
  const shaped =
    typeof value.played === "number" &&
    typeof value.won === "number" &&
    typeof value.streak === "number" &&
    typeof value.best === "number";
  return shaped ? (value as SoloRecord) : null;
}

export const soloStore = createLocalStore<SoloRecord>(KEY, EMPTY_SOLO, revive);

export function recordSolo(winner: PlayerId | null): SoloRecord {
  const record = soloStore.read();
  const won = winner === YOU;
  const streak = won ? record.streak + 1 : 0;
  return soloStore.write({
    played: record.played + 1,
    won: record.won + (won ? 1 : 0),
    streak,
    best: Math.max(record.best, streak),
  });
}

export function resetSolo(): SoloRecord {
  return soloStore.write(EMPTY_SOLO);
}
