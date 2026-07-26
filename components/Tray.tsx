"use client";

import type { Category, DraftPick, PlayerId } from "@/lib/types";
import { ROSTER_SIZE } from "@/lib/draft";
import { Plate } from "./Plate";
import { CoinTag } from "./Coins";

type Props = {
  player: PlayerId;
  name: string;
  picks: DraftPick[];
  category: Category;
  /** On the clock — the tray tips forward. */
  active?: boolean;
  /** Total shown in the moulded score window. Hidden during the draft. */
  score?: number | null;
  /** Which pick orders have been flipped over, by entry id. */
  revealedIds?: ReadonlySet<string>;
  /** Runs the closing wave across this tray's windows. */
  slam?: boolean;
  onRename?: (name: string) => void;
  winner?: boolean;
  /** Trays grow into the pool's space once the draft is over. */
  plateSize?: "grid" | "tray";
  /** Coins still in hand. */
  coins?: number | null;
};

/**
 * A player's tray: four moulded recesses that fill as they draft, plus the score
 * window. Red is always player one and blue always player two, in every category.
 */
export function Tray({
  player,
  name,
  picks,
  category,
  active = false,
  score = null,
  revealedIds,
  slam = false,
  onRename,
  winner = false,
  plateSize = "tray",
  coins = null,
}: Props) {
  const slots = Array.from({ length: ROSTER_SIZE }, (_, i) => picks[i] ?? null);

  return (
    <div
      className="tray moulded p-2.5 sm:p-3"
      data-player={player}
      data-active={active ? "true" : "false"}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        {onRename ? (
          <input
            value={name}
            onChange={(event) => onRename(event.target.value.slice(0, 14))}
            aria-label={`Player ${player + 1} name`}
            className="min-w-0 flex-1 rounded-sm border-b-2 border-transparent bg-transparent font-display text-xs uppercase text-plate outline-none transition-colors placeholder:text-plate/40 hover:border-plate/30 focus:border-brass sm:text-sm"
            spellCheck={false}
          />
        ) : (
          <span className="min-w-0 flex-1 truncate font-display text-xs uppercase text-plate sm:text-sm">
            {name}
          </span>
        )}

        {winner ? (
          <span className="crown shrink-0 rounded-full border-2 border-ink bg-brass px-1.5 py-0.5 font-display text-[9px] uppercase text-ink">
            Winner
          </span>
        ) : null}

        {coins !== null ? <CoinTag amount={coins} className="shrink-0" /> : null}

        {score !== null ? (
          <span className="readout moulded-sunken shrink-0 rounded-md px-2 py-0.5 font-display text-base leading-tight text-brass sm:text-lg">
            <span key={score} className="tick inline-block">
              {score}
            </span>
          </span>
        ) : null}
      </div>

      <ul className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {slots.map((pick, index) => (
          <li key={pick?.entry.id ?? `empty-${index}`} className="contents">
            {pick ? (
              <Plate
                entry={pick.entry}
                state={revealedIds?.has(pick.entry.id) ? "revealed" : "upright"}
                icon={category.icon}
                accent={category.accentOnDark}
                player={player}
                price={pick.price}
                size={plateSize}
                slam={slam}
                slamDelay={index * 70}
              />
            ) : (
              <div className="slot" aria-hidden />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
