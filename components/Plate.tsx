"use client";

import type { Entry, IconName, PlayerId } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

export type PlateState = "upright" | "taken" | "revealed";

type Props = {
  entry: Entry;
  state: PlateState;
  icon: IconName;
  accent: string;
  /** Colours the reverse face. null while the name is still in the shared pool. */
  player?: PlayerId | null;
  /** What the winning bid cost, shown under the rating on the reverse. */
  price?: number | null;
  onPick?: () => void;
  disabled?: boolean;
  size?: "grid" | "tray" | "stage";
  /** Part of the losing tray's closing wave. */
  slam?: boolean;
  slamDelay?: number;
};

/**
 * One Guess Who window: a card-stock plate on a hinge, name on the front, rating
 * on the reverse. Built once and themed by props — the five categories differ
 * only by icon and accent.
 *
 * The rating is deliberately absent from the DOM until the panel is revealed.
 * Nothing hidden should be readable in devtools mid-draft.
 */
export function Plate({
  entry,
  state,
  icon,
  accent,
  player = null,
  price = null,
  onPick,
  disabled = false,
  size = "grid",
  slam = false,
  slamDelay = 0,
}: Props) {
  const interactive = Boolean(onPick) && state === "upright" && !disabled;
  const revealed = state === "revealed";

  const body = (
    <div
      className="window-hinge"
      data-state={state}
      data-slam={slam ? "true" : undefined}
      style={slam ? ({ "--slam-delay": `${slamDelay}ms` } as React.CSSProperties) : undefined}
    >
      {/* Front: the name plate */}
      <div className="window-face window-face--front">
        <div className="plate moulded flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[7px] px-1.5">
          <CategoryIcon
            name={icon}
            accent={accent}
            className={
              size === "tray"
                ? "h-5 w-5 shrink-0"
                : size === "stage"
                  ? "h-12 w-12 shrink-0 sm:h-16 sm:w-16"
                  : "h-7 w-7 shrink-0 sm:h-9 sm:w-9"
            }
          />
          <span
            className={`relative z-10 text-center font-extrabold uppercase leading-[1.1] tracking-tight text-ink ${nameSize(
              entry.name,
              size,
            )}`}
          >
            {entry.name}
          </span>
        </div>
      </div>

      {/* Reverse: the score. Solid player colour, so the whole board splits into
          red and blue as the reveal runs. */}
      <div className="window-face window-face--back">
        <div
          className="moulded flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[7px]"
          style={{
            background:
              player === 1
                ? "linear-gradient(180deg,var(--color-blue) 0%,var(--color-blue-deep) 100%)"
                : "linear-gradient(180deg,var(--color-red) 0%,var(--color-red-deep) 100%)",
          }}
        >
          {revealed ? (
            <>
              <span
                className={`font-display leading-none text-plate ${
                  size === "tray" ? "text-2xl" : size === "stage" ? "text-6xl" : "text-4xl sm:text-5xl"
                }`}
                style={{ textShadow: "0 2px 0 rgb(0 0 0 / 0.35)" }}
              >
                {entry.rating}
              </span>
              {/* What it cost, right next to what it was worth. */}
              {price !== null ? (
                <span
                  className={`mt-1 font-display uppercase leading-none tracking-wider text-brass ${
                    size === "tray" ? "text-[8px]" : "text-[10px]"
                  }`}
                >
                  paid {price}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onPick}
        className="window group cursor-pointer transition-transform duration-150 hover:-translate-y-1 active:translate-y-0 disabled:cursor-not-allowed motion-reduce:hover:translate-y-0"
        aria-label={`Draft ${entry.name}`}
      >
        {body}
      </button>
    );
  }

  return (
    <div className="window" aria-label={revealed ? `${entry.name}, rated ${entry.rating}` : entry.name}>
      {body}
    </div>
  );
}

/** Long titles ("Star Wars: The Empire Strikes Back") have to shrink to fit. */
function nameSize(name: string, size: "grid" | "tray" | "stage"): string {
  const length = name.length;
  if (size === "tray") {
    if (length > 22) return "text-[8px]";
    if (length > 14) return "text-[9px]";
    return "text-[10px]";
  }
  if (size === "stage") {
    if (length > 26) return "text-base sm:text-lg";
    if (length > 16) return "text-lg sm:text-xl";
    return "text-xl sm:text-2xl";
  }
  if (length > 26) return "text-[10px] sm:text-xs";
  if (length > 16) return "text-[11px] sm:text-sm";
  return "text-xs sm:text-base";
}
