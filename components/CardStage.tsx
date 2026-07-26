"use client";

import type { Category, Entry, PlayerId } from "@/lib/types";
import { Plate } from "./Plate";
import { CoinIcon } from "./Coins";

type Props = {
  card: Entry;
  category: Category;
  /** How many names are still face-down behind this one. */
  remaining: number;
  cardNumber: number;
  totalCards: number;
  names: [string, string];
  /** Whose call it is by snake order — a reminder, not a restriction. */
  firstSay: PlayerId | null;
  /** The winning bid being recorded. */
  bid: number;
  onBid: (value: number) => void;
  /** Coins each player still holds. */
  purse: [number, number];
  rosterFull: [boolean, boolean];
  onAssign: (player: PlayerId) => void;
  onUndo?: () => void;
};

/**
 * One name at a time, face-up on the table, with the winning bid recorded next
 * to it.
 *
 * The app is the scorekeeper, not the auctioneer: the two players bid at each
 * other in the room, and then whoever won taps their own button with what it
 * cost. Nothing here enforces turn order. The only hard limits are a roster of
 * four and the coins actually in hand.
 */
export function CardStage({
  card,
  category,
  remaining,
  cardNumber,
  totalCards,
  names,
  firstSay,
  bid,
  onBid,
  purse,
  rosterFull,
  onAssign,
  onUndo,
}: Props) {
  const who = (player: PlayerId) => names[player] || `Player ${player + 1}`;

  /** Why a player can't take this card, or null when they can. */
  const blocker = (player: PlayerId): string | null => {
    if (rosterFull[player]) return "Roster full";
    if (bid > purse[player]) return `Only ${purse[player]} left`;
    return null;
  };

  return (
    <section
      className="mt-3 flex flex-col items-center"
      aria-label="Card on the table"
    >
      <p className="font-display text-[10px] uppercase tracking-[0.2em] text-plate/45">
        Card {cardNumber} of {totalCards}
      </p>

      <div className="relative mt-2.5 w-[8.5rem] sm:w-40">
        {/* Face-down remainder, peeking out behind the live card. */}
        {Array.from({ length: Math.min(remaining, 3) }, (_, i) => (
          <span
            key={i}
            className="stack-edge"
            style={{
              transform: `translate(${(i + 1) * 4}px, ${(i + 1) * 4}px)`,
              zIndex: -1,
            }}
            aria-hidden
          />
        ))}

        {/* Keyed on the card so the deal-in animation replays for each name. */}
        <div key={card.id} className="deal-in relative">
          <Plate
            entry={card}
            state="upright"
            icon={category.icon}
            accent={category.accentOnDark}
            size="stage"
          />
        </div>
      </div>

      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-plate/35">
        {remaining > 0 ? `${remaining} still face-down` : "Last one"}
        {firstSay !== null ? (
          <>
            {" · "}
            <span className={firstSay === 0 ? "text-red" : "text-blue"}>
              {who(firstSay)}
            </span>{" "}
            opens
          </>
        ) : null}
      </p>

      {/* The winning bid. */}
      <div className="mt-4 flex flex-col items-center">
        <label
          htmlFor="bid"
          className="flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-brass"
        >
          <CoinIcon className="h-3.5 w-3.5" />
          Winning bid
        </label>

        <div className="mt-1.5 flex items-center gap-1.5">
          <Step
            onClick={() => onBid(bid - 5)}
            disabled={bid <= 0}
            label="Lower the bid by 5"
          >
            &minus;5
          </Step>
          <Step
            onClick={() => onBid(bid - 1)}
            disabled={bid <= 0}
            label="Lower the bid by 1"
          >
            &minus;
          </Step>

          <output
            id="bid"
            className="readout moulded-sunken min-w-[3.25rem] rounded-md px-2 py-1.5 text-center font-display text-2xl leading-none text-brass"
          >
            {bid}
          </output>

          <Step onClick={() => onBid(bid + 1)} label="Raise the bid by 1">
            +
          </Step>
          <Step onClick={() => onBid(bid + 5)} label="Raise the bid by 5">
            +5
          </Step>
        </div>
      </div>

      <p className="mt-4 font-display text-xs uppercase tracking-wide text-plate/70">
        Who won it?
      </p>

      <div className="mt-2 flex w-full max-w-md gap-2.5">
        {([0, 1] as PlayerId[]).map((player) => {
          const reason = blocker(player);
          return (
            <button
              key={player}
              type="button"
              onClick={() => onAssign(player)}
              disabled={reason !== null}
              className={`moulded flex-1 rounded-lg px-2 py-3 font-display text-sm uppercase tracking-wide text-plate transition-transform duration-150 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:enabled:hover:translate-y-0 ${
                player === 0 ? "bg-red" : "bg-blue"
              }`}
            >
              <span className="block truncate">{who(player)}</span>
              <span className="mt-1 block text-[10px] font-bold tracking-widest opacity-85">
                {reason ?? `Pays ${bid} · ${purse[player] - bid} left`}
              </span>
            </button>
          );
        })}
      </div>

      {onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          className="mt-3 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-plate/50 transition-colors hover:text-plate"
        >
          &#8630; Undo last card
        </button>
      ) : null}
    </section>
  );
}

function Step({
  onClick,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="moulded h-9 w-9 rounded-md bg-plate/15 font-display text-xs leading-none text-plate transition-transform duration-150 enabled:active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
