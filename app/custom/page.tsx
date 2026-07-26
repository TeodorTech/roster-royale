import type { Metadata } from "next";
import Link from "next/link";

import { CATEGORIES, CUSTOM_CATEGORY } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Padlock } from "@/components/Padlock";
import { POOL_SIZE, ROSTER_SIZE } from "@/lib/draft";

export const metadata: Metadata = {
  title: "Custom Game — Roster Royale",
  description:
    "Name any category, pick how many names, and get a rated box you can draft like the built-in ones.",
};

/**
 * The upsell. Every locked surface in the app points here, and this page has
 * exactly two jobs: say what the custom box does, and say honestly where it is.
 *
 * Nothing here collects anything. The form is a disabled preview of the real
 * one — showing the product beats describing it — and the roadmap below is the
 * only place status is stated, so there is one thing to edit when it moves.
 */

/** Edit as the build moves. `active` is what is being worked on right now. */
const ROADMAP: { label: string; detail: string; status: "done" | "active" | "next" }[] = [
  {
    label: "Generator",
    detail: "Turns a category name into rated entries with written rationales.",
    status: "active",
  },
  {
    label: "Rating quality",
    detail: "Tuning the rubric so a generated box drafts as well as a hand-made one.",
    status: "active",
  },
  {
    label: "Accounts & payment",
    detail: "Somewhere to keep the boxes you generate, and a way to pay for them.",
    status: "next",
  },
  {
    label: "Public release",
    detail: "No date yet. Every box already on the shelf stays free when it lands.",
    status: "next",
  },
];

const STATUS_LABEL: Record<"done" | "active" | "next", string> = {
  done: "Done",
  active: "In progress",
  next: "Not started",
};

export default function CustomPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-8 sm:pt-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.16em] text-brass hover:text-plate"
      >
        <span aria-hidden>&larr;</span> Back to the shelf
      </Link>

      {/* --- hero ----------------------------------------------------------- */}
      <header className="mt-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center">
          <CategoryIcon
            name={CUSTOM_CATEGORY.icon}
            accent={CUSTOM_CATEGORY.accent}
            className="h-14 w-14"
          />
        </span>

        <h1 className="mt-5">
          <span className="sr-only">Custom Game</span>
          <span
            className="moulded inline-block -rotate-1 rounded-md bg-brass px-5 py-1.5 font-display text-2xl uppercase leading-none tracking-wide text-ink sm:px-7 sm:py-2 sm:text-4xl"
            aria-hidden
          >
            Custom Game
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-balance text-sm leading-relaxed text-plate/70">
          The {CATEGORIES.length} boxes on the shelf are the ones we wrote. This one you write:
          name any category, say how many names you want in it, and get back a rated box you can
          draft exactly like the others.
        </p>

        <p className="mt-5 inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-ink/40 px-3.5 py-1.5 font-display text-[10px] uppercase tracking-[0.16em] text-brass">
          <Padlock className="h-4 w-4" />
          Locked — in development
        </p>
      </header>

      {/* --- what it does --------------------------------------------------- */}
      <section className="mt-14">
        <h2 className="text-center font-display text-[11px] uppercase tracking-[0.2em] text-brass">
          How it will work
        </h2>

        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              n: 1,
              title: "Name it",
              body: "Anything you can describe. “Bond villains”, “EPL managers”, “the group chat”.",
            },
            {
              n: 2,
              title: "Size it",
              body: `Pick how many names go in the box. More names means a fresher pool each game.`,
            },
            {
              n: 3,
              title: "Draft it",
              body: `It joins your shelf and plays by the same rules — ${ROSTER_SIZE} picks each from a pool of ${POOL_SIZE}.`,
            },
          ].map((step) => (
            <li
              key={step.n}
              className="moulded plate relative overflow-hidden rounded-lg p-4 pt-5 text-ink"
            >
              <span className="moulded absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-brass pb-0.5 pl-0.5 font-display text-base text-ink">
                {step.n}
              </span>
              <h3 className="font-display text-sm leading-none">{step.title}</h3>
              <p className="mt-2 pr-6 text-[12px] leading-relaxed text-ink/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* --- disabled preview of the real form ------------------------------ */}
      <section className="mt-14">
        <h2 className="text-center font-display text-[11px] uppercase tracking-[0.2em] text-brass">
          What you&rsquo;ll get
        </h2>

        <div className="moulded plate relative mt-5 overflow-hidden rounded-xl p-5 sm:p-7">
          <span className="locked-hatch" aria-hidden />

          {/* `disabled` on the fieldset is what makes this inert and keeps every
              control out of the tab order — no pointer-events hacks needed. */}
          <fieldset disabled className="relative z-10 space-y-5">
            <legend className="sr-only">Custom game preview (not yet available)</legend>

            <div>
              <span className="block font-display text-[10px] uppercase tracking-[0.16em] text-ink/50">
                Category
              </span>
              <div className="locked-field mt-2 px-3.5 py-3 text-sm font-bold text-ink/35">
                90s cartoon villains
              </div>
            </div>

            <div>
              <span className="block font-display text-[10px] uppercase tracking-[0.16em] text-ink/50">
                How many names
              </span>
              <div className="mt-2 flex gap-2">
                {[20, 30, 50].map((count) => (
                  <span
                    key={count}
                    data-selected={count === 30 ? "true" : undefined}
                    className="locked-field flex-1 py-2.5 text-center font-display text-sm text-ink/35 data-[selected=true]:bg-ink/20 data-[selected=true]:text-ink/55"
                  >
                    {count}
                  </span>
                ))}
              </div>
            </div>

            <div className="moulded flex items-center justify-center gap-2 rounded-lg bg-ink/25 py-3.5 font-display text-sm uppercase tracking-wide text-plate/45">
              <Padlock className="h-5 w-5" />
              Generate my box
            </div>
          </fieldset>
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-plate/40">
          A preview, not a working form — nothing above is connected and nothing is collected.
        </p>
      </section>

      {/* --- honest status -------------------------------------------------- */}
      <section className="mt-14">
        <h2 className="text-center font-display text-[11px] uppercase tracking-[0.2em] text-brass">
          Where it&rsquo;s at
        </h2>

        <ul className="readout moulded-sunken mt-5 divide-y divide-plate/10 rounded-xl px-5 py-2">
          {ROADMAP.map((item) => (
            <li key={item.label} className="flex items-start gap-3.5 py-4">
              <span className="lamp mt-1" data-status={item.status} aria-hidden />
              <div className="min-w-0">
                <h3 className="font-display text-[13px] leading-none text-plate">
                  {item.label}
                  <span className="ml-2 align-middle text-[9px] uppercase tracking-[0.14em] text-brass">
                    {STATUS_LABEL[item.status]}
                  </span>
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-plate/55">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="moulded inline-block rounded-lg bg-red px-6 py-3 font-display text-sm uppercase tracking-wide text-plate transition-transform duration-150 hover:-translate-y-1 active:translate-y-0 motion-reduce:hover:translate-y-0"
        >
          Play a free box
        </Link>
        <p className="mt-4 text-[11px] text-plate/40">
          All {CATEGORIES.length} built-in categories are free, with no account.
        </p>
      </div>
    </main>
  );
}
