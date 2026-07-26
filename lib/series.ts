"use client";

import type { PlayerId } from "./types";
import { createLocalStore } from "./store";

/**
 * The running tally for tonight — "Teo 2, Alex 1" across rounds and categories.
 * localStorage only: no accounts, nothing leaves the device.
 */

const KEY = "roster-royale.series.v1";

export type Series = {
  names: [string, string];
  wins: [number, number];
  draws: number;
  rounds: number;
};

export const EMPTY_SERIES: Series = {
  names: ["Player 1", "Player 2"],
  wins: [0, 0],
  draws: 0,
  rounds: 0,
};

function revive(parsed: unknown): Series | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const value = parsed as Partial<Series>;
  const shaped =
    Array.isArray(value.names) &&
    value.names.length === 2 &&
    value.names.every((n) => typeof n === "string") &&
    Array.isArray(value.wins) &&
    value.wins.length === 2 &&
    value.wins.every((n) => typeof n === "number") &&
    typeof value.draws === "number" &&
    typeof value.rounds === "number";
  return shaped ? (value as Series) : null;
}

export const seriesStore = createLocalStore<Series>(KEY, EMPTY_SERIES, revive);

export function saveNames(names: [string, string]): Series {
  return seriesStore.write({ ...seriesStore.read(), names });
}

export function recordResult(winner: PlayerId | null): Series {
  const series = seriesStore.read();
  const wins: [number, number] = [...series.wins];
  if (winner !== null) wins[winner] += 1;
  return seriesStore.write({
    ...series,
    wins,
    draws: series.draws + (winner === null ? 1 : 0),
    rounds: series.rounds + 1,
  });
}

/** Clears the tally but keeps whatever the players called themselves. */
export function resetSeries(): Series {
  return seriesStore.write({ ...EMPTY_SERIES, names: seriesStore.read().names });
}
