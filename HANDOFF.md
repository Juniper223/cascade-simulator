# CASCADE Simulator — Complete Handoff Prompt

**Date:** 27 April 2026  
**Status:** Minimal almanac shell live (commit 24676a3). Requires 8 chapters, CASCADE Clock, cascade plate, appendices, back cover.  
**Repo:** github.com/Juniper223/cascade-simulator  
**Live:** cascade-simulator.pages.dev (auto-deploys from GitHub main)

---

## Vision

CASCADE is a weekly almanac — a definitive source of truth for orienting yourself in a crisis. It presents 23 interconnected systems (cascade nodes), leading-indicator signals, severity measures, and a "seconds to midnight" clock. It is beautiful, editorial, searchable, sourced sentence-by-sentence, and designed to help anyone understand what is happening now, how it compares to history, and what to expect in the next 3–12 months.

The design is stripped of personal/custom elements; it is a public-facing analysis platform. Future: personal analytics go to a separate personal.html.

---

## Current State

### Single HTML File (`index.html`)
- **Structure:** Vigil opener → Masthead → Lede (drop cap) → Coming-soon contents → temporary colophon
- **Fonts:** Fraunces (serif, variable) + IBM Plex Mono
- **Palette:** 
  - `--paper: #F4EFE6` (cream)
  - `--ink: #1A1714` (near-black)
  - `--muted: #6B6357`
  - `--vermilion: #C8431C`
  - `--vigil: #14110E` (near-black for opener)
  - `--link: #3D5A6C`, `--sev-low: #6B7A4F`, `--sev-mid: #B88A2C`, `--sev-high: #A23217`
- **Key sections:**
  - `.vigil` — full-height dark opener, centered italic line
  - `.masthead` — "Cascade" title + Issue + date
  - `.lede` — drop-cap paragraph, two columns of justified prose
  - `.coming` — Roman numeral list of arriving chapters (Sun–Fri)
  - `.colophon` — temporary footer (will expand to full back cover)
- **Progress bar:** Fixed red hairline (2px) at top, scrolls with page

### JavaScript Structure (Future)
The old site (backup/before-almanac-rebuild) contains a DATA object with:
- 21–23 cascade nodes (each with tier, source quality, connections)
- 67 directed connections (fedBy/feedsInto)
- 13 leading-indicator signals
- Predictions board
- Historical tracking

New architecture:
- **Nodes:** 23 measures (life expectancy, housing, inflation, geopolitics, etc.) with `outcome: true` flag for final outcomes
- **Signals:** 13 leading indicators (e.g., job cuts, oil price, recession fear)
- **Edges:** Derived from connections array at runtime (buildEdgeMaps function)
- **Toggles:** ski, pen (both default false) control score visibility
- **CASCADE Clock:** Composite severity (0–100) mapped to minutes-to-midnight (0–20), with weekly delta in seconds

---

## Pending Work

### Phase 1: Core Infrastructure (High Priority)

#### 1.1 Deployment Fix
- **Issue:** Cloudflare auto-deploy may not have fired for commit 24676a3. cascade-simulator.pages.dev still shows old site.
- **Fix:** Check Cloudflare dashboard (cascade-simulator project → Deployments). Verify GitHub webhook is active. Redeploy if needed.
- **Blocker:** Requires browser/Cloudflare dashboard access (not available in Claude headless sessions).

#### 1.2 CASCADE Clock
- **Location:** New section after `.lede` (before `.coming`)
- **Content:**
  - Large centered severity number (0–100) in Fraunces 300
  - Subtitle: "minutes to midnight" + numeric (0–20, calculated as `severity / 5`)
  - Weekly delta in small monospace (e.g., "+47 seconds" or "−89 seconds")
  - Short explanatory paragraph (1 sentence)
- **Styling:** `.clock` container, centered, generous vertical spacing
- **Data source:** Composite of all 23 measures; severity = mean(measure values)

#### 1.3 Cascade Plate (Illuminated Graph)
- **Location:** New section after `.coming`
- **Type:** Botanical-style illuminated network diagram (not a technical network graph)
- **Visual:** SVG or canvas. Nodes as circles/blossoms, edges as vines or flowing lines. Color nodes by severity tier (low=green, mid=yellow, high=red). Highlight `outcome: true` nodes with a special mark (⌖).
- **Interactivity:** Hover/tap to highlight node and its 1-step neighbors. Click to navigate to chapter.
- **Scale:** Responsive, fills canvas width (max ~1100px).

---

### Phase 2: The Eight Chapters (Medium Priority)

Each chapter:
- **Location:** New section after cascade plate
- **Length:** ~500 words (adjustable)
- **Structure (Five-Beat Rhythm):**
  1. **Question** — Opens with "Why does X matter?"
  2. **State** — Present situation (1–2 sentences)
  3. **Long View** — Historical context or comparisons
  4. **Next Move** — What to watch / what individuals/institutions can do
  5. **Cascade** — How this connects to other measures
- **Citations:** Superscript numbers (e.g., `word<sup>1</sup>`) anchored to appendix bibliography
- **Styling:** `.chapter` container (`.column` width 640px, centered), justified serif body text

#### Chapters (in order):
1. **I. Work and Wages** — Tech layoffs, wage stagnation, AI displacement
2. **II. Housing and Cost of Living** — Mortgage rates, rent inflation, affordability
3. **III. Health and Care** — Life expectancy stall, health equity, mental health
4. **IV. Society and Belonging** — Social cohesion, inequality, political polarization
5. **V. Environment, Food, Supply** — Climate events, crop failures, supply chain stress
6. **VI. Geopolitics and Security** — Strait of Hormuz, Iran/US tanker conflict, global tensions
7. **VII. Governance and Trust** — Political confidence, institutional trust, regulatory capture
8. **VIII. Human Outcomes** — Subjective wellbeing, migration, displacement, conflict deaths

---

### Phase 3: Appendices (Medium Priority)

#### 3.1 The Standings
- **Content:** Table of all 23 measures ranked by velocity (fastest changing first)
- **Columns:** Rank | Measure | Current Value | Weekly Change | Severity Tier | Trend Icon
- **Styling:** `.standings` table, bordered, accessible

#### 3.2 Watch List
- **Content:** The 13 leading-indicator signals as short prose paragraphs (2–3 sentences each)
- **Examples:** "Job cuts announced this week (20,000+)", "Oil price jump (16%)", "Consumer sentiment (49.8)"
- **Styling:** `.watch-list` container, each signal as `.watch-item`

#### 3.3 Outlook
- **Content:** Three sections:
  - **Next Week (0–7 days):** 2–3 key events to watch
  - **Next Quarter (1–3 months):** Medium-term risks and opportunities
  - **Next Year (3–12 months):** Structural shifts, long-term trends
- **Styling:** `.outlook` container, each subsection as a `<h3>` + paragraph

#### 3.4 Predictions (Accountability Board)
- **Content:** Archive of past week's forecasts vs. actual outcomes (if applicable)
- **Table:** Date | Prediction | Outcome | Status (✓ Correct / ✗ Wrong / ? Pending)
- **Styling:** Accessible table

---

### Phase 4: Back Cover & Metadata (Low Priority)

#### 4.1 Small Graces
- **Content:** 3–5 positive news items or inspiring stories (optional, for balance)
- **Styling:** `.small-graces` section, serif italics, smaller font

#### 4.2 Poem Fragment
- **Content:** A short poem (~12 lines) reflecting on the week's cascade
- **Styling:** `.poem` container, centered, italics

#### 4.3 Full Colophon
- **Current:** "Issue 04 of CASCADE is being set, this week, in Fraunces and IBM Plex Mono on cream paper."
- **Expand to:**
  - Fonts & typography details
  - Design philosophy
  - Data sourcing methodology (link to Sources)
  - Publication date & next issue date
  - GitHub link
- **Styling:** `.colophon` (already exists, keep as-is)

#### 4.4 Sources / Bibliography
- **Content:** Numbered list of all sources cited in chapters and appendices
- **Format:**
  ```
  [1] Author (Year). "Title." Publication. URL
  [2] ...
  ```
- **Styling:** `.sources` section, `.source-item` for each entry

---

### Phase 5: Personal Page (Optional, Lower Priority)

#### 5.1 personal.html
- **Purpose:** Separate analytics for the user (ski, pen toggles, score history, etc.)
- **Content:** Personal dashboard, historical charts, custom alerts
- **Deploy:** To same URL (cascade-simulator.pages.dev/personal, or separate subdomain)
- **Note:** Strip from main index.html once personal.html is ready

---

## Technical Guidelines

### Data Object (JavaScript)
```javascript
const DATA = {
  nodes: [
    { id: "life-expectancy", label: "Life Expectancy (UK)", value: 81.4, tier: 2, source: "ONS", outcome: true, fedBy: [...], feedsInto: [...] },
    // ... 22 more nodes
  ],
  connections: [
    { from: "job-cuts", to: "wage-pressure", strength: "strong" },
    // ... 66 more edges
  ],
  signals: [
    { id: "tech-layoffs", label: "Tech job cuts announced (week)", value: 20000, unit: "jobs" },
    // ... 12 more signals
  ]
};
```

### Key Functions
- **buildEdgeMaps():** Derives fedBy/feedsInto from connections array at load time
- **calculateSeverity():** Mean of all 23 measure values (0–100 scale)
- **cascadeClock():** severity / 5 → minutes-to-midnight
- **weeklyDelta():** Compare this week's severity to last week's (stored in history)

### Toggle Behavior
- `ski` and `pen` toggles default to `false` (no data shown on load)
- User can opt-in to see their personal scores
- Toggle state is persisted to localStorage

### Accessibility
- Prefers-reduced-motion media query already present
- All images/icons have alt text or aria-label
- Color contrast ratios meet WCAG AA
- Semantic HTML (h1, h2, section, article, etc.)

### Responsive Design
- Base font: 16px (1rem)
- Max content width: 640px (`.column`) or 1100px (`.canvas`)
- Breakpoint: 560px (adjusts lede drop cap, masthead padding, vigil height)
- All font sizes use `clamp()` for fluid scaling

---

## Deployment Workflow

1. **Make changes to `index.html`** (only file)
2. **Test locally:** Open in browser, verify layout & functionality
3. **Commit:** `git add index.html && git commit -m "message"`
4. **Push:** `git push -u origin claude/fix-cascade-simulator-Zflwp` (development branch)
5. **Merge to main:** (via PR or direct push) `git push origin claude/fix-cascade-simulator-Zflwp:main`
6. **Cloudflare auto-deploys** within ~1 minute

### Troubleshooting Deployment
- If live site doesn't update: Check Cloudflare → cascade-simulator → Deployments
- Verify GitHub webhook is connected
- Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
- Check cascade-simulator.pages.dev in incognito/private window

---

## Design Principles

1. **Editorial, not dashboard:** Every word and number is justified. Margins are generous. Typography leads.
2. **Beautiful bad news:** The content is often dire, but the design is calming, readable, and respects the reader's time.
3. **Sourced transparency:** Every claim is footnoted. The reader can drill down to original data.
4. **Interconnection over isolation:** The cascade plate and chapter-to-chapter cross-references show how systems feed each other.
5. **Actionable:** Each chapter ends with "Next Move" — something readers can do or monitor.
6. **Timeless in a week:** The design doesn't date itself. The data does (Issue 04, 2 May 2026).

---

## File Locations & Git

- **Repo:** `/home/user/cascade-simulator`
- **Main file:** `index.html`
- **Development branch:** `claude/fix-cascade-simulator-Zflwp`
- **Live branch:** `main`
- **Backup (old site):** `backup/before-almanac-rebuild`

---

## Known Limitations & Next Steps

1. **Cloudflare deployment:** Requires dashboard access to verify/retry. Likely a one-time fix.
2. **Cascade plate SVG:** Design is non-trivial. Consider outsourcing or using a lightweight library (D3.js, Vega).
3. **Data sourcing:** Chapter content and signals list require research and writing. Plan ~3–5 days for thorough sourcing and fact-checking.
4. **Predictions archive:** Requires date-stamped storage (localStorage, JSON file, or database). Defer until Phase 2 is complete.
5. **Mobile testing:** Test chapters on iPhone/iPad at 375px, 768px, 1024px widths.

---

## Quick Start for Next Session

1. Read this file end-to-end.
2. Check Cloudflare deployment status (if possible).
3. Pick one task from Phase 1 or 2 (CASCADE Clock is a good start — high ROI, ~2–3 hours).
4. Make changes to `index.html` in `/home/user/cascade-simulator`.
5. Test in browser (open file or serve locally with `python -m http.server 8000`).
6. Commit and push to `claude/fix-cascade-simulator-Zflwp`.
7. Merge to `main` when ready.

---

## Questions?

- **Why only one HTML file?** Cloudflare Pages auto-deploys from a single entry point. Keeping it monolithic ensures fast, zero-latency deploys.
- **Why Fraunces + IBM Plex Mono?** Fraunces is a beautiful, readable variable serif with a classical editorial feel. IBM Plex Mono provides technical authority for numbers and citations.
- **Why the CASCADE Clock instead of a dashboard?** The "minutes to midnight" metaphor is intuitive and urgent. It's a single number that summarizes complexity.
- **Why chapters instead of a network diagram?** Prose scales better than visualization for nuance. The chapters explain the "why" behind the connections.

---

## Contacts & References

- **GitHub:** github.com/Juniper223/cascade-simulator
- **Live:** cascade-simulator.pages.dev
- **Cloudflare:** (dashboard access required)
- **Design Inspiration:** "The Causal Layered Analysis" (Inayatullah), "How to Invent the Future Without Predicting It" (Dunne & Raby), "Visual Complexity" (Lima)

---

**Last updated:** 27 April 2026  
**Next handoff:** After Phases 1–2 are complete (CASCADE Clock + Cascade Plate + Chapters I–III)
