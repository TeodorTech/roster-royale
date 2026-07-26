import { notFound } from "next/navigation";

import { getCategory } from "@/lib/categories";
import { isSeedCode } from "@/lib/rng";
import { Game } from "@/components/Game";

/**
 * `searchParams` is a Promise in Next 16, so this stays a server component and
 * hands plain props to the client game.
 *
 * A `seed` in the URL replays that exact pool; without one the client mints a
 * fresh code on mount.
 */
export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; seed?: string }>;
}) {
  const { category: categoryId, seed } = await searchParams;
  const category = getCategory(categoryId);
  if (!category) notFound();

  return <Game category={category} seed={seed && isSeedCode(seed) ? seed : undefined} />;
}
