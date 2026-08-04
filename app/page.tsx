import Link from "next/link";

import { CATEGORIES, CUSTOM_CATEGORY } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Padlock } from "@/components/Padlock";
import { Wordmark } from "@/components/Wordmark";
import { POOL_SIZE, ROSTER_SIZE } from "@/lib/draft";

/**
 * The shelf. One product, one box per category.
 *
 * Seeds are minted on the client at draft time rather than here, so this page
 * stays fully static and two people opening it never land on the same pool. That
 * is also why the mode rides the href instead of a toggle: a client component
 * here would put a hydration flicker on the one button that matters.
 */

/** The box the front-door button opens. Fixed, so `next/link` can prefetch it. */
const FIRST_GAME = CATEGORIES[0];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-10 sm:pt-16">
      <header className="text-center">
        <Wordmark className="mx-auto" />
        <p className="mx-auto mt-5 max-w-md text-balance text-sm leading-relaxed text-plate/70">
          Draft {ROSTER_SIZE} names from a pool of {POOL_SIZE} with every rating
          hidden, then flip them over. Play the House on your own, or pass one
          phone round with a friend.
        </p>

        {/* The front door. Most people arrive alone, so it opens a solo round in
            one tap rather than asking them to choose a category first. */}
        <Link
          href={`/play?category=${FIRST_GAME.id}&mode=solo`}
          className="moulded mt-7 inline-block rounded-lg bg-brass px-8 py-3.5 text-center transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:hover:translate-y-0"
        >
          <span className="block font-display text-base uppercase tracking-wide text-ink sm:text-lg">
            Start a game
          </span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-ink/55">
            Solo &middot; Duo
          </span>
        </Link>
      </header>

      <h2 className="mb-4 mt-12 text-center font-display text-[11px] uppercase tracking-[0.2em] text-brass">
        Or pick a category
      </h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {CATEGORIES.map((category) => (
          <li key={category.id} className="contents">
            <Link
              href={`/play?category=${category.id}&mode=solo`}
              className="box-lid moulded plate relative flex flex-col justify-between overflow-hidden rounded-lg p-4 sm:p-5"
            >
              {/* The one place the category accent gets to be loud. */}
              <span
                className="absolute inset-x-0 top-0 h-2 border-b-[3px] border-ink"
                style={{ background: category.accent }}
                aria-hidden
              />

              <CategoryIcon
                name={category.icon}
                accent={category.accent}
                className="relative z-10 mt-3 h-10 w-10 sm:h-12 sm:w-12"
              />

              <div className="relative z-10 mt-6">
                <h3 className="font-display text-base leading-none text-ink sm:text-lg">
                  {category.label}
                </h3>
                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/45">
                  {category.entries.length} names
                </p>
              </div>
            </Link>
          </li>
        ))}

        {/* The paid box. Same lid as the others so it reads as part of the set,
            sealed in brass so it plainly isn't included. */}
        <li className="contents">
          <Link
            href={CUSTOM_CATEGORY.href}
            className="box-lid box-lid--locked moulded plate relative flex flex-col justify-between overflow-hidden rounded-lg p-4 sm:p-5"
          >
            <span
              className="absolute inset-x-0 top-0 h-2 border-b-[3px] border-ink"
              style={{ background: CUSTOM_CATEGORY.accent }}
              aria-hidden
            />
            {/* Foil hatching, so the tile reads as sealed at a glance. */}
            <span className="locked-hatch" aria-hidden />

            <span className="absolute right-3 top-5 z-20 sm:right-4">
              <Padlock className="h-7 w-7 sm:h-8 sm:w-8" />
            </span>

            <CategoryIcon
              name={CUSTOM_CATEGORY.icon}
              accent={CUSTOM_CATEGORY.accent}
              className="relative z-10 mt-3 h-10 w-10 sm:h-12 sm:w-12"
            />

            <div className="relative z-10 mt-6">
              <h3 className="font-display text-base leading-none text-ink sm:text-lg">
                {CUSTOM_CATEGORY.label}
              </h3>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/45">
                {CUSTOM_CATEGORY.teaser}
              </p>
            </div>
          </Link>
        </li>
      </ul>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-plate/40">
        Every box opens solo. Got someone with you? Switch to two players on the
        next screen.
        <br />
        Nothing to install, no account.
      </p>
    </main>
  );
}
