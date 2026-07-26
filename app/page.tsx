import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Wordmark } from "@/components/Wordmark";
import { POOL_SIZE, ROSTER_SIZE } from "@/lib/draft";

/**
 * The shelf. Five boxed games, one product, one box per category.
 *
 * Seeds are minted on the client at draft time rather than here, so this page
 * stays fully static and two people opening it never land on the same pool.
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-10 sm:pt-16">
      <header className="text-center">
        <Wordmark className="mx-auto" />
        <p className="mx-auto mt-5 max-w-md text-balance text-sm leading-relaxed text-plate/70">
          Two players. Draft {ROSTER_SIZE} names each from a pool of {POOL_SIZE}, with every rating
          hidden. Then flip them over.
        </p>
      </header>

      <h2 className="mb-4 mt-12 text-center font-display text-[11px] uppercase tracking-[0.2em] text-brass">
        Pick a category
      </h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {CATEGORIES.map((category) => (
          <li key={category.id} className="contents">
            <Link
              href={`/play?category=${category.id}`}
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
      </ul>

      <p className="mt-8 text-center text-[11px] text-plate/40">
        Pass-and-play on one device. Nothing to install, no account.
      </p>
    </main>
  );
}
