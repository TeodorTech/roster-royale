import actors from "@/data/actors.json";
import movies from "@/data/movies.json";
import athletes from "@/data/athletes.json";
import tvSeries from "@/data/tvSeries.json";
import carBrands from "@/data/carBrands.json";
import gotCharacters from "@/data/gotCharacters.json";
import hotdDragons from "@/data/hotdDragons.json";
import marvelHeroes from "@/data/marvelHeroes.json";
import heritageClubs from "@/data/heritageClubs.json";

import type { Category, CategoryFile, Entry, IconName, LockedCategory } from "./types";
import { readableOn } from "./color";

/** Kept in sync with `--table` in globals.css — accents are checked against it. */
export const TABLE_BG = "#3B2A22";

const ICONS: IconName[] = [
  "film-reel",
  "popcorn",
  "jersey-number",
  "tv-frame",
  "car-silhouette",
  "sword",
  "dragon",
  "hero-mask",
  "crest-shield",
];

function isIconName(value: string): value is IconName {
  return (ICONS as string[]).includes(value);
}

/**
 * Flags malformed entries in development instead of letting a bad rating quietly
 * skew a match. Bad entries are dropped, not thrown on — one typo in a 50-name
 * file should not take the game down.
 */
function validate(file: CategoryFile): Entry[] {
  const seen = new Set<string>();
  const kept: Entry[] = [];

  for (const entry of file.entries) {
    const problems: string[] = [];
    if (!entry.id) problems.push("missing id");
    if (!entry.name) problems.push("missing name");
    if (typeof entry.rating !== "number" || entry.rating < 0 || entry.rating > 100) {
      problems.push(`rating out of range: ${String(entry.rating)}`);
    }
    if (!entry.rationale) problems.push("missing rationale");
    if (entry.id && seen.has(entry.id)) problems.push("duplicate id");

    if (problems.length > 0) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[roster-royale] ${file.category}: skipping "${entry.name ?? entry.id}" — ${problems.join(", ")}`,
        );
      }
      continue;
    }
    seen.add(entry.id);
    kept.push(entry);
  }
  return kept;
}

function toCategory(file: CategoryFile): Category {
  return {
    id: file.category,
    label: file.label,
    icon: isIconName(file.icon) ? file.icon : "film-reel",
    accent: file.accentColor,
    accentOnDark: readableOn(file.accentColor, TABLE_BG),
    rubric: file.rubric,
    note: file.note,
    entries: validate(file),
  };
}

/**
 * Display order for the shelf. Adding a category is an import plus one entry
 * here — no other code changes, per the plan's decoupling requirement.
 */
export const CATEGORIES: Category[] = [
  actors,
  movies,
  athletes,
  tvSeries,
  carBrands,
  gotCharacters,
  hotdDragons,
  marvelHeroes,
  heritageClubs,
].map((file) => toCategory(file as CategoryFile));

export function getCategory(id: string | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/**
 * The one paid box on the shelf. It sits outside `CATEGORIES` on purpose — it
 * has no entries to draft, so `getCategory` must never return it and
 * `/play?category=custom` stays a 404 rather than a crash.
 *
 * Brass rather than a category colour: gold is the upgrade, not a genre.
 */
export const CUSTOM_CATEGORY: LockedCategory = {
  id: "custom",
  label: "Custom Game",
  icon: "custom-spark",
  accent: "#F0A81C",
  teaser: "Any category you want",
  href: "/custom",
};
