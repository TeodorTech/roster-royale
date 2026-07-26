/**
 * The lock that marks anything paid. Same moulded vocabulary as the category
 * icons — 24x24 grid, heavy ink stroke — so a locked tile still reads as part
 * of the set rather than as a disabled control.
 */
export function Padlock({
  className = "",
  accent = "var(--color-brass)",
}: {
  className?: string;
  accent?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="#17120F"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Shackle, drawn behind the body so the join stays clean. */}
      <path d="M7.8 10.4V7.6a4.2 4.2 0 0 1 8.4 0v2.8" />
      <rect x="4.2" y="10.2" width="15.6" height="11" rx="2.4" fill={accent} />
      <circle cx="12" cy="15" r="1.9" fill="#17120F" />
      <path d="M12 16.6v2.2" strokeWidth="2.1" />
    </svg>
  );
}
