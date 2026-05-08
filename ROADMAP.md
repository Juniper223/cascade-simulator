# Cascade — Roadmap

A living document. Cross things off, add things to, link new commits in. Anyone (Claude or otherwise) reading fresh should be able to get up to speed in five minutes.

**Live:** [cascade-simulator.pages.dev](https://cascade-simulator.pages.dev)
**Repo:** github.com/Juniper223/cascade-simulator
**Local:** `/Users/Jen/cascade-simulator-deploy/index.html`
**Deploy:** Cloudflare Pages auto-deploys from `main`. Never Vercel.
**Local preview:** `/loop` not needed — `mcp__Claude_Preview__preview_start name=cascade` (port 5176)

---

## What Cascade is

A weekly almanac that helps a reader orient in a crisis. Twenty-three interconnected systems, sourced sentence by sentence. Issue lands every Friday. Beautiful, calm, dense. Medieval-almanac aesthetic, modern data-journalism rigour.

The reader should walk away with: **where we were · where we are · what's next.**

---

## Where we are (post-Issue 04 rebuild · 28 Apr 2026)

**Design system (locked unless flagged):**
- Display font for "Cascade" wordmark: **Woodgod** (self-hosted, /fonts/woodgod.ttf)
- Illuminated drop-cap (lede only): **Camelot Caps** (/fonts/CamelotCaps.ttf)
- Body serif: **Fraunces** (Google variable)
- Labels, eyebrows, marginalia, almanac line: **IM Fell DW Pica SC** (Google)
- Clock numerals: **Cinzel Decorative** (Google)
- Mono fallback: IBM Plex Mono
- Palette: cream `#F4EFE6`, ink `#1A1714`, vermilion `#C8431C`, vigil `#14110E`
- Section ornament: small vermilion diamond + flanking rules
- Paper texture: subtle SVG noise multiply-blend

**Architecture:**
- Single `index.html` (no build step)
- All data in one `DATA` constant in the inline script
- Helpers `seededMeasures()`, `measuresInChapter()`, `findChapter()`, `upcomingChapters()`
- Render IIFEs read from DATA: Clock, plate, glance grid, anchors, chapter measures footers, Standings, Coming list, marginalia placement
- DATA holds: issue meta, chapters[], measures[] (with prevValue, sourceUrl, deltaText, outcome, seeded), edges[], anchors[]

**Page reading order:**
1. Vigil opener (dark)
2. Masthead (Cascade title, almanac date stamp)
3. Lede (two paragraphs, three figures with marginalia)
4. The Cascade Clock (single number + WoW delta)
5. The bottom-line panel (where we were · are · next)
6. At-a-glance grid (23 cells)
7. The Cascade plate (illuminated chart)
8. Where we have seen this before (3 historical anchors)
9. Chapters I–VIII (each: takeaway + 2 paragraphs + 3 measures with deltas + sources)
10. The Standings (all 23 measures by severity with deltas)
11. Watch List (5 leading signals, next 2 weeks)
12. Outlook (next week / quarter / year)
13. Predictions (5 forward calls, scored next week)
14. Small Graces (4 positive items)
15. Poem (10 lines, original)
16. Colophon

**Honest current limitations:**
- All measure values are hand-edited each week
- WoW deltas are fabricated — no real Issue 03 baseline
- No archive of past issues
- No automatic data fetch
- No publish automation
- Several measures are still US-primary when issue should be UK-primary
- No per-chapter visual (sparkline / illustration)

---

## The arc to a real weekly product

### Phase 1 — Visual & editorial rebuild ✅ done
- Medieval almanac aesthetic locked
- Vigil, masthead, lede, Clock, plate, chapters, appendices all in place
- Sticky TOC, bottom-line panel, at-a-glance grid, historical anchors
- WoW deltas (fabricated baseline) on every measure
- Source links on every measure
- Chapters compressed to takeaway + 2 paragraphs
- Most recent commit: `858f259`

### Phase 2 — UK pivot + visual depth (next, 1–2 batches)
- [ ] Swap U-Mich consumer mood → **GfK UK Consumer Confidence**
- [ ] Swap BLS rent → **ONS UK Private Rent index**
- [ ] Swap U.S. real wages → **ONS UK real wages**
- [ ] Update lede to lead with UK figure (mortgage rate or GfK)
- [ ] Per-chapter inline diagram (sparkline of headline measure or 3-bar comparison)
- [ ] Per-chapter on-theme SVG glyph (work/scales, housing/key, health/lung, etc.)
- [ ] Marginalia returning to chapter bodies (source notes in right margin)
- [ ] Cross-references: when chapter mentions another, render a small vermilion link
- [ ] Section ornaments vary subtly by chapter

### Phase 3 — Real data infrastructure (the Cascade Data Fetcher MCP)
**Build:** A TypeScript MCP server with one tool per measure + a `fetch_all` tool. Output: structured JSON matching DATA.measures schema. Saturday command: "Run the Cascade fetcher" → fresh values, deltas computed against last Issue.

- [x] **SPEC** — `/Users/Jen/claudecode/cascade-data-fetcher/SPEC.md`
- [x] **Scaffold** MCP server with stdio transport, four tools (list_measures, fetch_one, fetch_all, validate), Fetcher interface, registry pattern
- [x] **First fetcher: FAO Food Price Index** — verified end-to-end (returns 128.5 March 2026, matches Issue 04)
- [x] **NASA GISTEMP** — global temperature anomaly (+1.28°C March 2026 vs 1951–80)
- [x] **U-Mich consumer sentiment** — via FRED UMCSENT (53.3 March 2026 final)
- [x] **Brent crude** — via FRED DCOILBRENTEU ($118 1 May close)
- [x] **ONS UK private rent** — scrapes /latest bulletin (+3.4% YoY 12 mo to March)
- [x] **ONS UK real wages** — scrapes /latest bulletin (+0.2% real, regular pay, CPIH-adjusted)
- [x] **Trussell Trust** — scrapes end-of-year stats (2.6m parcels in 2025)
- [x] **BoE 5-year fixed** — pulls series IUMBV45 from BoE CSV endpoint (4.82% March 2026, 75% LTV)
- [x] **Local JSON storage** at `~/.cascade/issues/issue-NN.json`
- [x] **Tools shipped:** list_measures · fetch_one · fetch_all · validate · save_issue · list_issues · compare_to_last
- [ ] Remaining tier-A: ONS life expectancy, Caldara-Iacoviello GPR, UNHCR
- [ ] Tier-B scrapers: Layoffs.fyi, NHS Excel, GfK / NIQ press release, CENTCOM
- [ ] Tier-C deferred: Anthropic Economic Index, Edelman annual PDF, Lloyd's (paid)
- [ ] Storage swap: local JSON → Cloudflare KV namespace `CASCADE_ISSUES`
- [ ] MCP registered in `~/.claude/mcp.json` (Jen runs `npm install && npm run build` then adds the entry)

### Phase 4 — Weekly publish automation
The pipeline is now a single shell command. All that's missing is a cron.
```
cd /Users/Jen/claudecode/cascade-data-fetcher && npm run publish-issue \
  && cd /Users/Jen/cascade-simulator-deploy && git commit -am "Issue NN data refresh" && git push
```
- [ ] Wrap that in a shell script
- [ ] Schedule weekly via GitHub Actions (cleanest) or local launchd / `mcp__scheduled-tasks`
- [ ] Email notification when issue lands (Resend or Buttondown later)
- [ ] Drift-checker — if any source returned wrong shape, email instead of pushing

### Phase 5 — Editorial AI assist
- [ ] Once data fetched, Claude prompted (with brand voice and shape constraints from this roadmap) to draft the writable parts: vigil opener, lede, 8 chapter takeaways + 2-paragraph bodies, watch list, outlook, predictions, small graces, poem
- [ ] Human review/edit pass before publish
- [ ] One-click ship

### Phase 6 — Add new measures (priority order)
Each goes in DATA.measures with chapter assignment, fetcher in MCP. Drop existing low-value ones if 23 cap matters.
- [ ] **Trussell Trust food-bank parcels** (UK, monthly) — household stress, hits the chapter-II story sharply
- [ ] **National Grid live carbon intensity** (UK real-time API) — chapter V, gives 24-hour window not just monthly
- [ ] **ACLED political violence dataset** (daily) — chapter VI, concrete event count
- [ ] **UK Home Office Channel crossings** (daily) — chapter VIII, paired with UNHCR's slow global figure
- [ ] **GfK UK Consumer Confidence** (already in phase 2)
- [ ] **EU ETS carbon allowance price** — chapter V
- [ ] **YouGov UK political polling** (weekly) — chapter VII
- [ ] **Bond breakeven inflation 5y5y** — chapter VIII, what markets expect

### Phase 7 — Archive + real history
- [ ] Each issue snapshot stored as JSON in KV
- [ ] Stable URLs `/issue/04/`, `/issue/05/` etc.
- [ ] Sparklines drawn from real stored history (not fabricated)
- [ ] "All issues" index page
- [ ] Real WoW deltas from real prior values (drop the "indicative" caveat)

### Phase 8 — Distribution
- [ ] `/feed.xml` RSS
- [ ] Email subscribe (Resend)
- [ ] Share-card image generator (Cascade Clock + headline takeaway → PNG)
- [ ] OG image per issue
- [ ] "Email this issue" share button

### Phase 9 — Beyond a single issue
- [ ] `/personal/` page — reader's own analytics, alerts on measures crossing thresholds
- [ ] Glossary (terms like GPR, RTT, breakeven, etc.)
- [ ] Print stylesheet → 4-page PDF for printing/saving
- [ ] Cascade-as-a-service: templating so other publications could do their own

---

## Locked decisions (don't relitigate)

- **Woodgod** is the masthead wordmark font. Not Sable Lion, not Brin Athyn, not UnifrakturMaguntia (all tried).
- **Camelot Caps** illuminated drop cap is **lede only**. Chapters use plain Fraunces vermilion ::first-letter.
- **No em dashes anywhere** in user-facing copy.
- **No fonts listed in the colophon.**
- **No "open source" claim or GitHub link** in the published issue.
- **No real-time ticking clock.** The Clock is a snapshot.
- **No vermilion vine flourishes around the Cascade title.**
- **No long four-paragraph chapters.** Two paragraphs (now + what next), preceded by a one-sentence vermilion takeaway.
- **No "THE STATE / THE LONG VIEW / WHAT TO WATCH / THE CASCADE" beat labels** in chapters. Prose carries the rhythm.
- **Cascade plate** is option B (almanac-chart radial layout), not option A (botanical illustration) or option C (cathedral cross-section).
- **Coming list** is removed once all chapters land.
- **CSP / `.gitignore`:** `.claude/` MUST be in `.gitignore` (orphan worktree gitlinks broke CF for nine days, see `8e196f0`).

---

## Tried and rejected (don't bring back without a fresh reason)

- IBM Plex Mono for labels — too Silicon Valley / dashboard
- UnifrakturMaguntia for masthead — too gothic / metal-band
- Sable Lion / Brin Athyn for masthead — close but Woodgod won
- Camelot Caps everywhere — gimmicky beyond the lede
- Cascade monogram SVG in colophon — Jen's verdict: hideous
- Real-time clock tick — felt nervous, not solemn
- "Three things broke this week and they were the same thing" lede tee-up — AI tell
- Symmetrical "Past did X, this time Y" sentence patterns — AI tell
- Beat labels in chapters — read as framework template

---

## Open design questions (good to revisit when ready)

1. **Voice — how much personality?** Currently restrained-editorial. Could be sharper / more opinionated. Currently safer.
2. **Eight chapters fixed forever, or weeks dictate?** Right now eight is locked. Could a thirteen-week issue have more chapters when warranted?
3. **Predictions ambition.** Five mostly-binary forward calls is conservative. Could include longer-horizon, harder calls.
4. **Mobile depth.** Plate works at desktop; on mobile it's compressed. Anchors stack OK. Some appendix tables wrap awkwardly on phones. Worth a dedicated mobile pass when Phase 2 lands.
5. **Pull quotes / decorative pull-outs.** Not yet attempted. Could land beautifully in chapters or as section dividers.

---

## Immediate next actions (this week)

1. **UK pivot.** Swap U-Mich → GfK, BLS rent → ONS, US real wages → ONS UK. Update lede to a UK-led opening figure. (~1 batch)
2. **Per-chapter sparkline** — even with fabricated history, the visual addition is the biggest upgrade against the "too text heavy" critique.
3. **Cascade Data Fetcher MCP — spec doc.** Decide tool surface, then scaffold one fetcher (suggest FAO Food Price Index as MVP since the CSV is clean) to prove the pattern.
4. **Decide storage** — Cloudflare KV (simpler) vs D1 (sortable history). KV is enough for now.
5. **Pick one new measure to add this week** as proof Phase 6 is real. Suggest **Trussell Trust food-bank parcels** — it's emotionally legible, on the cost-of-living arc, and Trussell publishes a public dataset.

---

## How to update this roadmap

When something ships, mark its checkbox `[x]` and add the commit ref. When a new decision is locked, add it to "Locked decisions". When something gets tried and rejected, add it to "Tried and rejected" with a one-line why. When the immediate-next-actions list goes stale, redraw it.

If a future Claude is reading this for the first time after a long gap: the most important section is **"Locked decisions"** — that's the work of weeks of iteration distilled into ten lines.
