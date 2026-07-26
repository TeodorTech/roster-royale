/** A stack of coins, for labelling a purse or a price. */
export function CoinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="#17120F"
      strokeWidth="1.4"
      aria-hidden
    >
      <ellipse cx="8" cy="11.4" rx="5.6" ry="2.6" fill="var(--color-brass)" />
      <path d="M2.4 11.4V8.2M13.6 11.4V8.2" />
      <ellipse cx="8" cy="8.2" rx="5.6" ry="2.6" fill="var(--color-brass)" />
      <path d="M2.4 8.2V5.1M13.6 8.2V5.1" />
      <ellipse cx="8" cy="5.1" rx="5.6" ry="2.6" fill="var(--color-brass)" />
    </svg>
  );
}

/** Coins in hand, or a price paid. */
export function CoinTag({
  amount,
  label,
  tone = "brass",
  className = "",
}: {
  amount: number;
  label?: string;
  tone?: "brass" | "quiet";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border-2 border-ink px-1.5 py-0.5 font-display text-[11px] leading-none ${
        tone === "brass" ? "bg-brass text-ink" : "bg-ink/35 text-plate"
      } ${className}`}
    >
      <CoinIcon className="h-3 w-3" />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{amount}</span>
      {label ? <span className="text-[9px] opacity-70">{label}</span> : null}
    </span>
  );
}
