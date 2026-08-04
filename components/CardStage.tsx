"use client";

import type { Category, Entry, GameMode, PlayerId } from "@/lib/types";
import { HOUSE, ROSTER_SIZE, YOU } from "@/lib/draft";
import { Plate } from "./Plate";
import { CoinIcon } from "./Coins";

type Props = {
  card: Entry;
  category: Category;
  mode: GameMode;
  /** How many names are still face-down behind this one. */
  remaining: number;
  cardNumber: number;
  totalCards: number;
  names: [string, string];
  /** Whose call it is by snake order — a reminder, not a restriction. */
  firstSay: PlayerId | null;
  /** The winning bid being recorded. Duo only. */
  bid: number;
  onBid: (value: number) => void;
  /** Coins each player still holds. */
  purse: [number, number];
  rosterFull: [boolean, boolean];
  onAssign: (player: PlayerId) => void;
  onUndo?: () => void;
  /** Solo: whether each call is still open, and how many names the player holds. */
  canTake?: boolean;
  canPass?: boolean;
  held?: number;
};

/**
 * One name at a time, face-up on the table.
 *
 * Duo is an auction the app scores rather than runs: the two players bid at each
 * other in the room, and then whoever won taps their own button with what it
 * cost. Nothing here enforces turn order. The only hard limits are a roster of
 * four and the coins actually in hand.
 *
 * Solo replaces all of that with one call — take the name or let it go to the
 * House. There is nobody to bid against, so the purse and the stepper are gone
 * and the scarce thing is the four passes.
 */
export function CardStage({
  card,
  category,
  mode,
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
  canTake = false,
  canPass = false,
  held = 0,
}: Props) {
  const solo = mode === "solo";
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
        {solo ? (
          <> &middot; you hold {held} of {ROSTER_SIZE}</>
        ) : firstSay !== null ? (
          <>
            {" · "}
            <span className={firstSay === 0 ? "text-red" : "text-blue"}>
              {who(firstSay)}
            </span>{" "}
            opens
          </>
        ) : null}
      </p>

      {solo ? (
        <SoloCalls
          held={held}
          canTake={canTake}
          canPass={canPass}
          onTake={() => onAssign(YOU)}
          onPass={() => onAssign(HOUSE)}
        />
      ) : (
        <>
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
        </>
      )}

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

/**
 * The solo call: keep this name, or let it go.
 *
 * Take is red because that is the player's tray. Pass is deliberately *not* blue
 * — blue belongs to the House, and a blue button under your thumb reads as
 * claiming the card rather than giving it away. The one place blue is right is
 * the last stretch, when handing it over is the only thing left to do.
 */
function SoloCalls({
  held,
  canTake,
  canPass,
  onTake,
  onPass,
}: {
  held: number;
  canTake: boolean;
  canPass: boolean;
  onTake: () => void;
  onPass: () => void;
}) {
  const slots = ROSTER_SIZE - held;

  // The player's four are in, so every name left is the House's. Handed over one
  // tap at a time rather than swept up automatically: watching the name you
  // passed on land on their side is the point, and it keeps undo meaningful.
  if (!canTake) {
    return (
      <div className="mt-4 flex w-full max-w-md flex-col items-center">
        <p className="font-display text-xs uppercase tracking-wide text-plate/70">
          Your four are in
        </p>
        <button
          type="button"
          onClick={onPass}
          className="moulded mt-2 w-full rounded-lg bg-blue px-2 py-3 font-display text-sm uppercase tracking-wide text-plate transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:hover:translate-y-0"
        >
          <span className="block">To the House &rarr;</span>
          <span className="mt-1 block text-[10px] font-bold tracking-widest opacity-85">
            The rest are theirs
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex w-full max-w-md flex-col items-center">
      {/* A greyed-out Pass with no explanation reads as a broken app, so the
          reason the choice went away gets said out loud. */}
      <p
        className={`text-balance px-2 text-center font-display text-xs uppercase tracking-wide ${
          canPass ? "text-plate/70" : "text-brass"
        }`}
      >
        {canPass ? "Take it or leave it?" : "You need every card left — take it"}
      </p>

      <div className="mt-2 flex w-full gap-2.5">
        <button
          type="button"
          onClick={onTake}
          className="moulded flex-1 rounded-lg bg-red px-2 py-3 font-display text-sm uppercase tracking-wide text-plate transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:hover:translate-y-0"
        >
          <span className="block">Take it</span>
          <span className="mt-1 block text-[10px] font-bold tracking-widest opacity-85">
            {slots === 1 ? "Last slot" : `${slots} slots left`}
          </span>
        </button>

        <button
          type="button"
          onClick={onPass}
          disabled={!canPass}
          className="moulded flex-1 rounded-lg bg-plate/15 px-2 py-3 font-display text-sm uppercase tracking-wide text-plate transition-transform duration-150 enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:enabled:hover:translate-y-0"
        >
          <span className="block">Pass</span>
          <span className="mt-1 block text-[10px] font-bold tracking-widest opacity-85">
            Goes to the House
          </span>
        </button>
      </div>
    </div>
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
