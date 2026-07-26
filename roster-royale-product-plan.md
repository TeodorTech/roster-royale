# Roster Royale — Product & Business Plan
*A draft-and-reveal prediction game, built from a live TikTok-style betting trend*

## 1. Executive Summary

Roster Royale turns an existing, organic social trend — friends putting up $20 each and drafting rosters (of actors, movies, athletes, and more) to bet on — into a lightweight, replayable web game. Two players draft from a shared pool of real, well-known names with no visible ratings, then the platform reveals hidden "power scores" and crowns a winner. No real money is handled by the app; it's built purely for bragging rights, designed to scale from a private friend-group tool into a public product.

**Closest existing comparable:** Hollywood Stock Exchange (HSX) has run a legal, real-name, virtual-currency celebrity/movie prediction market for over 20 years. Roster Royale borrows its core legitimacy (real names, no real money, entertainment-only framing) but replaces HSX's stock-trading model with a faster, more social draft-and-reveal format suited to short sessions between two people.

## 2. Core Concept

- Two players. Each builds a roster of 4 from a shared pool of 8 (or more, at scale).
- Snake draft order (P1, P2, P2, P1, P1, P2, P2, P1) so no duplicates and no first-pick advantage.
- Ratings are **hidden during the draft** — players are drafting on vibes/fame, not known values.
- After the draft, ratings are revealed and summed. Highest total wins bragging rights (and, off-platform, the $20-a-head pot the friends already agreed to).
- Same mechanic reskins across categories: **Actors, Movies, Athletes, TV Series, Car Brands** at launch.

## 3. Target Users

- **Phase 1:** You and your friend group — validate the loop is fun repeatedly, across categories.
- **Phase 2+:** Public users — any two people who want a 3-minute, low-stakes competitive game to play on a call, in person, or async. Positioning: "fantasy sports, but for pop culture, and it takes 3 minutes."

## 4. Gameplay Loop (per round)

1. Pick a category (Actors / Movies / Athletes / TV Series / Car Brands).
2. System pulls a random pool (e.g., 8 names) from that category's seed database.
3. Players snake-draft until each has a full roster (4 each).
4. Reveal screen: each pick's hidden rating flips over one at a time (this is the signature moment — see Section 8).
5. Totals tally, winner declared, with a short "why" (best pick, biggest bust, closest matchup).
6. Option to share a results card, rematch, or switch category.

## 5. Categories & Rating Rubrics

Each category needs its own consistent, documented rubric so scores feel fair rather than arbitrary — this also gives you a defensible answer when someone asks "why is X rated higher than Y."

| Category | Rubric (out of 100) |
|---|---|
| **Actors** | Box office draw (career + recent) · Critical prestige/awards · Current cultural buzz |
| **Movies** | Critical acclaim · Genre/cultural influence · Rewatchability & fan devotion · Commercial performance |
| **Athletes** | Current form/ranking · Career achievements · Marketability/fame · Big-moment reputation |
| **TV Series** | Critical acclaim · Cultural impact & longevity · Fan devotion/rewatchability · Awards/prestige |
| **Car Brands** | Brand prestige & heritage · Performance/engineering reputation · Cultural cachet & desirability · Reliability/value reputation |

Ratings should be regenerated/refreshed periodically for Athletes especially, since current form changes fast; Actors, Movies, and TV Series are far more stable and need less frequent updates; Car Brands shift slowest of all (new model years, reliability data).

## 6. Legal & IP Considerations
*(Not legal advice — flagging for your own judgment or a lawyer's, especially before wide public launch)*

- **No real money in-app** removes the biggest regulatory risk (gambling/money-transmitter licensing). Keep it that way for as long as possible — it's the single thing that keeps this closer to "fantasy sports" than "sportsbook."
- **Using real names is standard practice** in this genre (fantasy sports, HSX, prediction pools) and is generally treated as commentary/entertainment rather than an endorsement claim — but:
- **No avatars/images for now** — going text-only for launch sidesteps the trickiest part of this entirely (publicity/likeness rights for photos of named individuals). If avatars get added later, stick to stylized/abstract ones (initials, color, icon) rather than any photo or photo-realistic AI-generated likeness.
- Add a simple disclaimer somewhere in the footer: *"For entertainment purposes only. Ratings reflect the platform's own opinion, not the individuals named, who are not affiliated with or endorsing this product."*
- Car Brands are companies/trademarks, not individuals, so publicity rights don't apply there — but avoid using brand logos as visual assets without checking trademark-use guidelines if images are ever added.

## 7. Feature Scope by Phase

**Phase 1 — MVP (matches your current "same-device pass-and-play" answer)**
- No accounts required. Fully client-side Next.js app, deployed on Vercel.
- 5 categories live, seed database of 50 entries each for Actors/Movies/Athletes and 30 entries each for TV Series/Car Brands, shipped as JSON files inside the app.
- Draft + hidden-rating reveal flow, exactly as prototyped in this chat.
- Shareable results (image/link) so friends outside the room can see the outcome.

**Phase 2 — Public-ready**
- Optional accounts (to save match history, not required to play).
- Public/global leaderboards per category.
- "Leagues" — a persistent group of friends who track a running series (like your 2–1 tonight).
- Rooms with a shareable code for remote (not just same-device) play, if demand shows up.

**Phase 3 — Scale & credibility**
- Move ratings from single-author opinion toward blended real-world data (box office APIs, RT/Metacritic-style scores for Movies/TV Series, sports-record APIs for Athletes) especially where "current form" actually matters.
- Community submissions/voting for new names to add to each category's pool.
- Possible native/mobile wrapper if usage justifies it.

## 8. Visual Theme & The Signature Moment

**Theme: *Guess Who*.** The app should feel like the physical board game — a grid of flip-panel windows, bold primary colors (red frame, cream/yellow panel backgrounds), thick black outlines, a slightly retro-plastic feel rather than a slick modern SaaS look. This is a strong, specific reference — lean into it rather than softening it into generic "card game" styling.

- **Draft screen:** the shared pool renders as a grid of *Guess Who*–style flip windows, one per name. With no photos in play, each window shows the name on a card-stock plate with a small category icon standing in for the face (film reel/clapperboard for Actors, popcorn/ticket for Movies, jersey number for Athletes, TV frame for TV Series, car silhouette for Car Brands). Undrafted windows stand upright; drafting a name flips it down out of the shared pool and into that player's row of 4 slots below.
- **Reveal screen — the signature moment:** each drafted window physically flips over (a CSS 3D flip, matching the game's real motion) to reveal its rating on the back, one at a time, building the same suspense as flipping down a wrong guess in the real game. Save the biggest surprise for last.
- Keep the retro board-game texture consistent across all five category re-skins — swap only the icon and accent color per category, not the whole visual language, so it reads as one product with five modes rather than five different apps.

## 9. Technical Recommendation (for whoever builds this)

- **Phase 1:** Next.js app (App Router), deployed on Vercel — zero-config deploy, matches the "easy to ship" requirement directly. Seed data ships as static JSON files bundled with the app and loaded client-side; no backend or database needed to ship something playable today.
- **Phase 2:** Add a lightweight backend + database (Vercel Postgres, Supabase, or similar) only once accounts/leaderboards are actually wanted — don't build this prematurely.
- Keep the rating engine and the pool-randomization logic decoupled from the UI, so new categories are just "add a JSON file," not new code.
- Build the flip-card component (Section 8) once as an isolated, reusable piece, themed per category via props/CSS variables rather than duplicated per category.

## 10. Seed Data

Each entry needs just `name`, `rating (0–100)`, and a one-line `rationale` for the rating (useful for the reveal screen's "why" text) — no avatar field for now. Ship as one JSON file per category (e.g., `/data/actors.json`, `/data/carBrands.json`). Seed file sizes: **50 entries** each for Actors, Movies, and Athletes; **30 entries** each for TV Series and Car Brands. I can generate all five seed datasets as a follow-up deliverable — happy to do that next if useful.

## 11. Success Metrics (no revenue targets, since there's no monetization)

- Matches played per week within your friend group (Phase 1 bar: does it survive past the novelty round?)
- Once public: return-usage rate (do two-player groups come back for a rematch), shares of result cards, categories played per session.

## 12. Open Risks

- Subjective ratings will draw "you're wrong about X" pushback — the documented rubric (Section 5) is the mitigation, not a guarantee.
- Athlete ratings go stale fastest; Phase 3's real-data blend is the long-term fix. Car Brand ratings shift more slowly (new model years, reliability reports) but still need occasional refreshes.
- Public scale eventually raises the avatar/likeness question again if images get added later — keep "no photos of named individuals" as a standing constraint, not just a launch-day shortcut.

## 13. Next Steps

1. Name locked in: **Roster Royale**. Stack locked in: **Next.js, deployed on Vercel**. Theme locked in: **Guess Who–style flip cards** (Section 8).
2. Generate the five seed datasets (Section 10).
3. Hand this document + seed data to an implementation agent for the Phase 1 build.
