import type { IconName } from "@/lib/types";

/**
 * Stands in for the face on a Guess Who panel. No photographs of named people
 * anywhere in the product — the icon carries the category instead, which is also
 * the whole reason the likeness question never comes up.
 *
 * Drawn on a 24x24 grid with heavy strokes so they hold up next to 3px outlines.
 */

type Props = {
  name: IconName;
  className?: string;
  /** Fill for the accent parts; strokes always stay ink-black. */
  accent?: string;
};

export function CategoryIcon({ name, className, accent = "currentColor" }: Props) {
  const shared = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "#17120F",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "film-reel":
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="8.5" fill={accent} />
          <circle cx="12" cy="12" r="2.1" fill="#F0E1BE" />
          <circle cx="12" cy="6.4" r="1.7" fill="#F0E1BE" />
          <circle cx="12" cy="17.6" r="1.7" fill="#F0E1BE" />
          <circle cx="6.4" cy="12" r="1.7" fill="#F0E1BE" />
          <circle cx="17.6" cy="12" r="1.7" fill="#F0E1BE" />
        </svg>
      );

    case "popcorn":
      return (
        <svg {...shared}>
          {/* Tub */}
          <path d="M6.2 10h11.6l-1.3 10.5H7.5L6.2 10Z" fill={accent} />
          <path d="M9.4 10.6 10 20M14.6 10.6 14 20" />
          {/* Kernels spilling over the rim */}
          <circle cx="8.8" cy="7.6" r="2.5" fill="#F7ECD2" />
          <circle cx="12.2" cy="6" r="2.8" fill="#F7ECD2" />
          <circle cx="15.6" cy="7.8" r="2.4" fill="#F7ECD2" />
        </svg>
      );

    case "jersey-number":
      return (
        <svg {...shared}>
          <path
            d="M9 4.2 6 5.9 4.3 9.4l2.6 1.5.6-1.2v9.9h9v-9.9l.6 1.2 2.6-1.5L18 5.9l-3-1.7c-.7 1.3-1.7 2-3 2s-2.3-.7-3-2Z"
            fill={accent}
          />
          {/* A squad number, since the face is off-limits */}
          <path d="M10.6 12.4h2.8v5.1M12 17.5h2.4" strokeWidth="1.8" />
        </svg>
      );

    case "tv-frame":
      return (
        <svg {...shared}>
          <rect x="3.2" y="6" width="17.6" height="12.4" rx="2.2" fill={accent} />
          <rect x="5.6" y="8.4" width="9" height="7.6" rx="1" fill="#F0E1BE" />
          {/* Tuning dials and rabbit ears */}
          <circle cx="17.6" cy="10.4" r="1" fill="#17120F" />
          <circle cx="17.6" cy="13.6" r="1" fill="#17120F" />
          <path d="M8.5 6 6.2 2.8M13.5 6l2.3-3.2" />
        </svg>
      );

    case "car-silhouette":
      return (
        <svg {...shared}>
          <path
            d="M2.8 15.2v-2.1l2-.6 2.5-3.6c.4-.6 1-.9 1.7-.9h5.4c.7 0 1.4.3 1.8.9l2.3 3.3 2.7.8v2.8h-2"
            fill={accent}
          />
          <path d="M7.8 15.2h8.4" />
          <circle cx="7" cy="16.4" r="2.1" fill="#17120F" />
          <circle cx="17" cy="16.4" r="2.1" fill="#17120F" />
          <path d="M9.4 8.4 9 12.5h6l-.5-4.1" />
        </svg>
      );

    case "sword":
      return (
        <svg {...shared}>
          {/* Blade */}
          <path d="M12 2.4 14 4.4 12.9 15.2h-1.8L10 4.4 12 2.4Z" fill={accent} />
          <path d="M12 4.6v9.4" />
          {/* Crossguard and grip */}
          <path d="M7.4 15.2h9.2" strokeWidth="1.9" />
          <path d="M10.6 15.2v4.2h2.8v-4.2" fill="#F0E1BE" />
          <circle cx="12" cy="20.6" r="1.2" fill="#17120F" />
        </svg>
      );

    case "dragon":
      return (
        <svg {...shared}>
          {/* Wing */}
          <path
            d="M12.4 12.6 18.8 6c.6 2.6.2 5-1.2 7.1l2.2-.4-3 3.3-3.9-.5"
            fill={accent}
          />
          {/* Body, neck and tail */}
          <path
            d="M4 19.4c1.8-.2 3-.9 3.6-2.1.9-1.9.4-3.5 1.9-5 1.1-1.1 2.3-1.4 3.6-1.1l3.3-3.6.9 1.3-1.7 2.5c1 .9 1.5 1.9 1.5 3.1 0 2.4-2.1 4.1-4.6 4.5"
            fill={accent}
          />
          {/* Head, horn and eye */}
          <path d="M12.9 7.6 14.6 5l1.3.5-.9 2.6-1.9 1.8Z" fill={accent} />
          <circle cx="13.7" cy="7.4" r="0.55" fill="#17120F" />
          {/* Tail spikes */}
          <path d="M4 19.4 2.6 20.7M4.9 18 3.7 19.5" />
        </svg>
      );

    case "hero-mask":
      return (
        <svg {...shared}>
          <path
            d="M2.8 8.4c2.4-2.6 5.8-3.9 9.2-3.9s6.8 1.3 9.2 3.9c-1 3.4-2.9 5.4-5.6 5.4-1.6 0-2.5-1-3.6-1-1.1 0-2 1-3.6 1-2.7 0-4.6-2-5.6-5.4Z"
            fill={accent}
          />
          <path d="M6.6 8c1 1.6 2.1 2.4 3.3 2.4s1.6-.6 2.1-1.3M17.4 8c-1 1.6-2.1 2.4-3.3 2.4" />
        </svg>
      );

    case "crest-shield":
      return (
        <svg {...shared}>
          <path
            d="M12 2.6 19 5v6.2c0 4.6-2.9 8.1-7 10.2-4.1-2.1-7-5.6-7-10.2V5l7-2.4Z"
            fill={accent}
          />
          <path d="M12 6.4v11.2M8.6 10.4 12 12l3.4-1.6" fill="none" />
        </svg>
      );

    case "handbag":
      return (
        <svg {...shared}>
          {/* Handle first, so the body's fill closes it off at the rim */}
          <path d="M8.4 10V7.6a3.6 3.6 0 0 1 7.2 0V10" />
          <path d="M3.6 10h16.8l-1.4 10.2H5L3.6 10Z" fill={accent} />
          {/* Clasp */}
          <rect x="10.6" y="12.6" width="2.8" height="3.4" rx="0.8" fill="#F0E1BE" />
        </svg>
      );

    /* A blank plate waiting to be filled in — the custom box has no genre of
       its own, so the icon is the empty card plus the spark that fills it. */
    case "custom-spark":
      return (
        <svg {...shared}>
          <rect x="4.4" y="4.2" width="13.2" height="16" rx="2" fill={accent} />
          <path
            d="M10 8.6h2v2.8h2.8v2H12v2.8h-2v-2.8H7.2v-2H10V8.6Z"
            fill="#F0E1BE"
          />
          <path d="M18.6 2.4l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" fill="#F0E1BE" />
        </svg>
      );
  }
}
