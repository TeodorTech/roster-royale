# Roster Royale — Product & Business State

*Living document. Last updated 2026-08-04.*

This replaces the original pre-build plan. That document was written before a line of code existed and has drifted from what shipped in several load-bearing ways — most importantly, **the game is an auction, not a snake draft**. Sections 6 (legal), 8 (visual theme) and 12 (risks) survived contact with reality largely intact and are carried forward here.

---

## 1. Where things stand

Roster Royale is live, free, and has no backend. It turns an organic social trend — friends putting up $20 each and drafting rosters to bet on — into a 3-minute web game. Real names, hidden ratings, no real money in-app.

**Status:** public for roughly one week as of this update. First traffic data in §7.

**Closest comparable:** Hollywood Stock Exchange, which has run a legal real-name virtual-currency prediction market for 20+ years. We borrow its legitimacy framing and replace stock-trading with draft-and-reveal.

## 2. What actually ships

### The two modes

**Duo (pass-and-play, the original game).** The app is the *scorekeeper of an auction, not the auctioneer*. Eight names surface one at a time, face-up. The two humans bid at each other out loud; whoever wins taps their own button with what it cost. Each starts with a purse of **20 coins**. Nothing enforces turn order — the snake order `[0,1,1,0,0,1,1,0]` is shown as advisory ("Alex opens") and never restricts which button works. The only hard limits are a roster of four and the coins actually in hand.

**Solo (you vs the House).** The House is not an AI — it is *the complement of the player's choices*. Each card is Take or Pass; passed cards go to the House. There is nothing to balance and no cheating-by-seeing-ratings problem. Because the pool is exactly two rosters, the House's roster cap is what forces the endgame: pass four times and every remaining card must be taken. **No coins solo** — the scarce resource is the four passes.

### Shared skeleton

- Pool of **8**, roster of **4** each, ratings 0–100 hidden until every card is assigned.
- Reveal cascade: timed 3D flips ordered for suspense, not chronology — players alternate, and the pick furthest from the pool's mean flips **last**, because that is the one most likely to decide it.
- Tiebreaks in order: **points → coins in hand → best single pick → draw**. Solo reports zero coins, so it can never decide on them.
- Awards. Duo: Top pick / Best value / Overpaid. Solo: Your best call / The one you let go, plus a distance-from-perfect line.

### Why solo scores differently

Rating-per-coin ranks the duo awards, and solo pays nothing for anything — so there `bestValue` always equals `topPick` and nothing can ever be an overpay. Reusing `awardsFor` solo renders the same card twice. `soloAwardsFor` exists for this reason and there is an assertion pinning the degeneracy so nobody "simplifies" it back.

The solo retention hook is **off-perfect**: *"Perfect was 352 · you were 0 off · 4 of the best 4."* Beating the House alone is close to a coin toss, so "you won" says very little; distance from a flawless round is the score with a ceiling worth chasing.

## 3. Categories

Nine playable boxes plus one locked. Adding a category is an import plus one array entry — no other code changes.

| Category | Names | Icon |
|---|---|---|
| Actors | 50 | film-reel |
| Movies | 50 | popcorn |
| TV Series | 30 | tv-frame |
| Athletes | 50 | jersey-number |
| Game of Thrones | 30 | sword |
| House of the Dragons | 20 | dragon |
| Superheroes | 50 | hero-mask |
| Car Brands | 30 | car-silhouette |
| Designer Brands | 50 | handbag |
| *Custom Game* | *locked* | *custom-spark* |

Each seed file carries a documented **rubric** — the defensible answer to "why is X rated higher than Y". Entries are `{id, name, rating, rationale}`; the rationale is what the reveal screen reads out.

**Retired:** Marvel Superheroes and Sports Clubs. The `crest-shield` icon is still in the whitelist, currently unused.

The Superheroes box deliberately spans **American comics, manga/anime, and screen originals** — roughly a quarter Marvel, a third DC, a third anime, the rest indie and film. The first cut was 57% Marvel, which made it a Marvel box wearing a broader label and left the pool feeling same-y game to game.

**Refresh cadence:** Athletes goes stale fastest (ratings reflect mid-2026 standing). Actors / Movies / TV Series are stable. Car Brands and Designer Brands shift slowest.

**Grid note:** 9 playable + 1 locked = **10 tiles**, which is three full rows of three plus an orphan at `sm:` and up. It was flush at 9. One more category makes it 11; moving Custom out of the grid makes it 9 again.

## 4. Architecture

Next.js 16 App Router on Vercel. **No backend, no database, no accounts, no network calls.** Everything is static JSON bundled into the app plus localStorage.

**Routes:** `/` (static shelf) · `/play?category=&mode=&seed=` (dynamic) · `/custom` (static, coming-soon).

**The landing page must stay a server component.** A mode chooser that rewrites tile hrefs would put a hydration flicker on the one button that matters, so mode rides the URL instead — and deliberately is *not* sticky in localStorage, because a stale sticky `duo` would sabotage the exact funnel solo exists to fix.

**Logic is decoupled from UI.** `lib/draft.ts` is a pure reducer; `lib/score.ts` is pure functions. `lib/logic.check.ts` holds **66 assertions** run by `npm run check` (tsx, no test framework). This is the gate — the solo forcing rules were proved in Node before a pixel existed.

**Load-bearing invariants** (each has an assertion):
- `picks.length` is the card cursor. Exactly one code path appends to `picks`, which is why solo's Pass is `ASSIGN {player: HOUSE}` rather than a new action, and why undo works unchanged in both modes.
- `POOL_SIZE === ROSTER_SIZE * 2`. Solo's forcing rule depends on it; a future `POOL_SIZE = 10` would silently hang a solo round forever.
- Solo prices are forced to 0 **in the reducer**, not trusted from the caller.

**localStorage keys:** `roster-royale.series.v1` (duo tally + names), `roster-royale.solo.v1` (played/won/streak/best), `roster-royale.muted.v1`. Solo results deliberately never touch the duo tally — that tally is a score between two named humans and folding House losses into it would corrupt a real night's game.

**Design system:** Tailwind v4, configured entirely in CSS via `@theme` in `globals.css` (no config file). Bowlby One SC display / Nunito body. The governing rule: **red is always player 1 and blue always player 2, in every category** — the category accent is only ever the icon plus one stripe, and brass is reserved for focus, locked/paid state, and scores.

## 5. Visual theme — and the signature moment

**Theme: *Guess Who*.** Moulded plastic panels with thick black outlines on a dark walnut table, cream card-stock plates, red vs blue trays, panels that flip on hinges. Retro-plastic, not slick SaaS. Lean in rather than softening toward generic "card game".

No photographs of named people anywhere — the category icon stands in for the face, which is also the whole reason the likeness question never comes up.

**The signature moment** is the reveal: each drafted panel physically flips (CSS 3D) to show its hidden rating, one at a time, biggest surprise last. `prefers-reduced-motion` swaps rotation for cross-fades throughout. The rating is absent from the DOM until revealed, so it can't be read in devtools mid-draft.

## 6. Legal & IP

*(Not legal advice — flagged for your own judgment or a lawyer's before wide public launch.)*

- **No real money in-app.** This is the single thing keeping this closer to fantasy sports than to a sportsbook. Keep it that way as long as possible.
- **Real names are standard practice** in this genre and generally treated as commentary/entertainment rather than an endorsement claim.
- **No photos of named individuals — a standing constraint, not a launch-day shortcut.** If avatars ever arrive, stylized/abstract only.
- Footer disclaimer ships on every page: *"For entertainment purposes only. Ratings reflect the platform's own opinion, not the individuals named, who are not affiliated with or endorsing this product."*
- Car Brands and Designer Brands are companies/trademarks, so publicity rights don't apply — but avoid brand logos as visual assets without checking trademark guidelines. Both seed files carry this note.

## 7. Traffic, and what we can measure

**First week live:** ~100 landing views, ~20 reaching `/play` — **20% landing→play**.

Read carefully: for a free game with no signup and one click to play, 40–60% is normal, so 20% is low. **But 20/100 has a 95% confidence interval of roughly 13–29%.** You cannot distinguish 20% from 28% on this data. Do not A/B test at this volume; fix structural leaks that are visible in the code and wait for a real sample.

**The three leaks addressed so far:**
1. *"Two players."* was the opening sentence and the game genuinely required two people — disqualifying most visitors, who arrive alone on a phone. Fixed by solo mode plus a rewritten hero.
2. No start button — the CTA was a 10-way category decision. Fixed by a primary "Start a game" button that opens a solo round in one tap.
3. Landing copy described a snake draft the app never shipped.

**Instrumentation.** Vercel Web Analytics, pageviews plus four custom events, all tagged with category and mode:

| Event | Fires when |
|---|---|
| `draft_started` | first card assigned — the real "someone played" signal |
| `reveal_reached` | "Flip them over" pressed |
| `game_finished` | result banked (guarded once per seed) |
| `rematch` | play again |

The landing page is deliberately **not** instrumented — click events there would duplicate pageviews and would force the static page into a client component. If CTA-level attribution is wanted later, a `?from=cta` param is the zero-JS way to get it.

**The number to watch** is `draft_started` ÷ `/play` pageviews. That distinguishes a bounce from a game, and it was invisible before.

## 8. Success metrics

No revenue targets — there is no monetization yet.

- **Landing→play conversion.** Baseline 20% on n=100. Treat anything under ~50 sessions as noise.
- **Play→finish.** `draft_started` → `game_finished`. Brand new; no baseline yet.
- **Solo vs duo split.** Tells us whether the solo bet paid off, and whether "Play a friend" converts solo players into two-player sessions.
- **Return usage / rematch rate.** Does it survive the novelty round?
- Category mix per session.

## 9. What's built vs. what isn't

**Built:** both modes · 9 categories · reveal cascade · tiebreaks · awards · running series tally · solo streak record · seeded shareable pool codes · WebAudio sound (synthesized, no audio files ship) · reduced-motion support · funnel analytics · `/custom` coming-soon page.

**Not built, and previously promised:**
- **Shareable result cards.** Called the signature social loop in the original plan; only the seed code is printed under the results. Probably the highest-value unbuilt thing — it's the only organic acquisition channel in the design.
- **No OG image and no `metadataBase`.** Every link shared to a social platform currently previews as bare text. Cheap to fix, directly upstream of the traffic problem.
- **README is still create-next-app boilerplate.**
- Accounts, leaderboards, leagues, remote rooms — all Phase 2, none started, none needed yet.
- **The paid Custom Game box.** `/custom` describes a generator that turns any category name into a rated, draftable box. Roadmap on that page: generator and rating quality in progress; accounts & payment not started; no release date. **There is no email capture** — the page is currently a dead end for anyone it interests.

## 10. Open risks

- Subjective ratings will draw "you're wrong about X" pushback. The documented per-category rubric is the mitigation, not a guarantee.
- Athlete ratings go stale fastest; blending real-world data (box office, review aggregators, sports APIs) is the long-term fix and is not started.
- **The auction depends on two humans in a room.** Solo removes the hard blocker but is a genuinely different game — watch whether solo players ever convert to duo, or whether the two modes are just two audiences.
- Public scale raises the likeness question again if images are ever added. Keep the no-photos constraint.
- Traffic is the real bottleneck, not the product. One week at 100 views cannot validate or invalidate anything.

## 11. Next steps

1. **Wait for a real sample** before drawing conclusions from the funnel. Watch `draft_started` ÷ `/play` first.
2. **Ship an OG image + `metadataBase`.** Cheapest possible fix that touches acquisition.
3. **Build shareable result cards.** The one organic loop in the original design that never got built.
4. **Add email capture to `/custom`** so the traffic that reaches an admittedly locked page is worth something.
5. Refresh Athletes ratings; they were set to mid-2026 standing.
6. Replace the boilerplate README.
