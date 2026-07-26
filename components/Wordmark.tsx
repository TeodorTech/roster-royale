/**
 * Two stacked plaques, one red and one blue — the logo carries the same
 * red-is-player-one / blue-is-player-two rule the rest of the board runs on.
 */
export function Wordmark({
  className = "",
  size = "large",
}: {
  className?: string;
  size?: "large" | "small";
}) {
  const scale =
    size === "large"
      ? "text-2xl px-5 py-1.5 sm:text-4xl sm:px-7 sm:py-2"
      : "text-[11px] px-2 py-0.5";

  return (
    <span className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <span className="sr-only">Roster Royale</span>
      <span
        className={`moulded rounded-md bg-red font-display uppercase leading-none tracking-wide text-plate ${scale} -rotate-1`}
        style={{ textShadow: "0 2px 0 rgb(0 0 0 / 0.3)" }}
        aria-hidden
      >
        Roster
      </span>
      <span
        className={`moulded rounded-md bg-blue font-display uppercase leading-none tracking-wide text-plate ${scale} rotate-1`}
        style={{ textShadow: "0 2px 0 rgb(0 0 0 / 0.3)" }}
        aria-hidden
      >
        Royale
      </span>
    </span>
  );
}
