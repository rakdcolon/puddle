# Handoff: puddle — A Daily Puzzle Column

## Overview

**puddle** is a quiet, NYT-puzzle-page-style daily puzzle web app. One puzzle a day across six genres (logic, deduction, quant, sequences, lateral riddles, wordplay). Editorial vocabulary — cream paper, serif type, italic captions, no leaderboards, no notification spam. The product opinion is the opposite of streak-pressure apps: solve when you like, see your record only if you want it.

The app currently has the following surfaces:

- **Landing** — masthead, editorial lede, today's puzzle teaser card with three states (default / solved / revealed)
- **Puzzle** — the playable puzzle UI itself, with timer, hints, scratchpad, and post-solve transition
- **About** — editorial column about the project and author
- **Sign in** — single-CTA Google sign-in
- **Submit a puzzle** — reader submission form with title, prompt, answer, hints, solution walkthrough, and metadata
- **Solution** — worked-solution walkthrough for any given puzzle (one numbered-step pattern, plus an outcome banner that varies based on `?from=solved` vs `?from=revealed`)
- **Profile** — user's solving record (level/xp, stat tiles, GitHub-style calendar heatmap, recent puzzles, genre breakdown)
- **Settings** — account, experience, data sections with toggles + segmented controls
- **404** — editorial "an issue we never printed" not-found page

## About the Design Files

The files in this bundle are **design references created in HTML, CSS, and a small amount of JSX**. They are prototypes showing intended look and behavior — they are **not production code** to copy verbatim.

The task is to **recreate these designs in the target codebase's existing environment** (React, Next.js, Vue, SwiftUI, etc.) using its established patterns, component primitives, and styling system. If no environment exists yet, **Next.js + Tailwind + a tiny component layer** is the most natural fit for this design (everything is editorial flow layouts plus a single dynamic widget — the puzzle).

The HTML prototypes use:
- Vanilla CSS (no Tailwind, no preprocessor)
- A single Google Font: **Crimson Pro**
- React 18 + Babel-standalone for the puzzle component only (so it can hot-reload during design)
- `localStorage` for the entire data layer (no backend)

A real implementation will need to:
- Replace `localStorage` with a real auth + database (recommended: Google OAuth + Supabase or Firebase; see *Backend Requirements* below)
- Replace the inline Babel/JSX with proper components
- Replace the editorial fictions (Vol. III · No. 147, "12,481 solving today", etc.) with real data sources
- Keep the visual system pixel-faithful

## Fidelity

**High-fidelity (hifi)**. The mocks are pixel-perfect with final colors, typography, spacing, shadows, and interactions. The developer should recreate the UI pixel-faithfully using the codebase's component primitives — every value below is intentional.

---

## Design Tokens

### Color palette

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#f5ecdb` | Page background — cream paper |
| `--paper` | `#fcf7ea` | Cards, inputs, surfaces above the page |
| `--paper-deep` | `#efe5cf` | Inset backgrounds, tracks, hover states |
| `--ink` | `#3a2f22` | Primary text, primary button bg |
| `--ink-soft` | `#6e5d48` | Italic emphasis text, sub-headlines |
| `--ink-muted` | `#a59581` | Captions, dates, meta, italic notes |
| `--hair` | `#ebe0c9` | 1px borders between low-contrast surfaces |
| `--hair-strong` | `#d9caa6` | 1px borders, dividers, dashed rules |
| `--accent` | `#b85a3e` | Rust accent — kickers, links, primary actions |
| `--success` | `#6b8a52` | Sage success — correct chime, "Nicely done" |

### Typography

- **Single family throughout:** `"Crimson Pro", "Iowan Old Style", Georgia, serif`
- Load from Google Fonts with italic weights 400, 500, 600, 700 and roman 400, 500, 600, 700
- `font-feature-settings: "ss01", "cv02"` enabled site-wide on `html, body`
- Italic is used for: captions, datelines, em emphasis, button hints ("or press ↵ enter"), section eyebrows. Italic body text is muted (`--ink-soft` or `--ink-muted`).
- Tabular numerics for timers, stats, and any UI number (`font-variant-numeric: tabular-nums`)
- Oldstyle numerics for dates (`font-variant-numeric: oldstyle-nums`)

### Type scale (page contexts)

| Use | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|
| Hero title (Landing, SignIn) | 60–84px | 500 | -1.2px to -1.6px | 0.98–1.0 |
| Section/section-page title | 38–46px | 500 | -0.8px to -1.0px | 1.0 |
| Card title | 28–44px | 500 | -0.4px to -0.6px | 1.04 |
| H2 (italic eyebrow inside articles) | 22px | 500 (italic) | -0.2px, color = accent | 1.0 |
| Body copy | 17–19px | 400 | normal | 1.5–1.65 |
| Meta / dateline | 13–15px | 400 (italic) | 0.1–0.2px | 1.5 |
| Stat numerics (Profile) | 34–42px | 500 | -0.5px | 1.0 |

### Spacing

- Base unit: 4px. Common values: 4, 8, 12, 14, 16, 18, 22, 24, 28, 32, 36, 40, 44, 56, 72
- Page horizontal padding: 56px desktop, 24px tablet, 20px phone
- Page max-width: 1280px (Profile, Settings) or 1440px (Landing, Solution, others)

### Border radius

- 3px — tiny tile mark cells
- 4px — calendar heatmap cells
- 10px — segmented control inner buttons, inputs
- 12px — primary inputs, ghost buttons, dialog buttons
- 14px — primary buttons, cards
- 16px — stat tile group, calendar wrapper
- 18px — large hero cards, modal dialog, form-card
- 50% — avatars, status badges, dots

### Shadows

```css
--shadow:        0 1px 2px rgba(58,47,34,.04), 0 6px 24px rgba(58,47,34,.05);
--shadow-card:   0 1px 2px rgba(58,47,34,.05), 0 10px 36px rgba(58,47,34,.08);
```

Inline button shadow: `0 2px 6px rgba(58,47,34,.18)` (rises to `0 4px 14px rgba(58,47,34,.22)` on hover).

### Easing

- Global: `cubic-bezier(.22,.99,.32,1)` — applied to all transitions and animations as `--ease`
- Standard duration: 0.18s for hover states, 0.25s for transforms, 0.5–0.8s for entrance/reveal

---

## The Logo Mark

The brand mark is a **2×2 puzzle-tile grid**, 26×26px in the masthead.

```html
<span class="logo-mark" aria-hidden="true">
  <i></i><i></i><i></i><i></i>
</span>
```

```css
.logo-mark {
  width: 26px; height: 26px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  border-radius: 3px;
  overflow: hidden;
}
.logo-mark i { background: var(--ink); }
.logo-mark i:nth-child(2),
.logo-mark i:nth-child(3) { background: var(--accent); }
```

Cells are arranged: `[ink, accent / accent, ink]` (diagonal accent). The wordmark sits directly to its right: **"puddle"** in 26px serif, 500 weight, -0.4px letter-spacing.

The favicon (`favicon.svg`) uses the same mark scaled up.

The OG share image (`og-default.png`, 1200×630) uses the same mark centered with the wordmark below.

---

## Shared Chrome

Every page except Puzzle.html uses the same masthead + footer pattern:

### Masthead

```
┌─────────────────────────────────────────────────────────┐
│  Vol. III · No. 147     [tile] puddle      About  Sign in │
└─────────────────────────────────────────────────────────┘
   ────────────────── hairline ──────────────────
```

- Three-column grid: `1fr auto 1fr`
- Left: italic dateline ("Vol. III · No. 147" with accent dot)
- Center: logo (tile + wordmark) — wrapped in `<a href="Landing.html">`
- Right: nav links — current page has `class="current"` (rust color + italic + bottom underline rust)
- Bottom: `border-bottom: 1px solid var(--hair)` + a 3px-margined extra `.rule-thin` for the editorial double-rule feel

**Signed-in variant** (Profile.html, Settings.html): nav links become "About · Profile · Settings · Sign out" instead of "About · Sign in".

### Footer

```
Established 2026.            About    Submit a puzzle    Contact
   ──────────────────────────────────────────────────────────
```

- `border-top: 1px solid var(--hair)`
- Left: italic muted cite ("Established 2026.")
- Right: three links separated by 24px gap, ink → accent on hover

---

## Screens / Views

### 1. Landing.html

**Purpose:** Front door. Show today's puzzle teaser, invite the visitor to begin. If they've already solved/given up today, swap the card to a "Solved" or "Revealed" state with a link to the worked solution.

**Layout:**
- Page padding: 28px top, 56px sides, 24px bottom
- Two-column body grid: `1.05fr / 0.95fr` with 72px gap
- Left: editorial lede (kicker, hero title, body, meta row)
- Right: today's puzzle card (paper, 18px radius)

**Lede (left column):**
- Kicker: italic accent text "A daily puzzle column" with 28×1px accent rule before it
- Title: 84px serif 500, weight 500, `text-wrap: balance`. Em-italic phrases use `--ink-soft`; spans with class `ink-accent` use rust + italic. Default copy: *"A puzzle, delivered each day."*
- Body: 19.5px, 38ch max-width, with `.quiet` spans for italic muted secondary clauses
- Meta row: `<strong>` bold values + italic muted labels, separated by `·` hair-strong dividers. Three stats: live solver count, best time so far, countdown to next puzzle

**Today's puzzle card (right column):**

Has three mutually exclusive state blocks. The script reads `localStorage['puddle.daily']` on load and shows whichever block matches today's NY-anchored date:

- **default:** pulsing rust dot + "Today — May 27" stamp top-right, eyebrow with genre + 5-dot difficulty meter, card title, prompt with a `.tease` italic muted suffix, ink primary button "Begin today's puzzle →" plus an italic "avg. 4:12 to solve" note
- **solved:** sage check + "Solved — May 27" stamp, "Nicely done." italic sage headline, card title, "Solved in 3:42, with 1 hint." summary, primary "Read the worked solution →", and "next in 14h 23m" italic
- **revealed:** muted dot + "Revealed — May 27" stamp, "See you tomorrow." italic muted headline, card title, "Today's answer was **17**.", primary "Read the worked solution →"

The card has a 280px italic serif numeral ("147") absolute-positioned bottom-right at z-index 0, with the content above at z-index 1. This is the column-issue mark.

**Tweaks panel:** A small floating panel (`<aside class="tweaks">`) at bottom-right toggled by the parent frame via `postMessage('__activate_edit_mode' | '__deactivate_edit_mode')`. Lets the designer demo accent colors, alt headlines, dateline format, and force the card state for screenshots.

**Live countdown:** `.js-countdown` elements update every 30s (every 1s in the final hour) via `Intl.DateTimeFormat({timeZone: 'America/New_York'})` math to midnight ET. Format: `Xh Ym`, then `Mm SSs` in the final hour, then `Ss` in the final minute.

### 2. Puzzle.html

**Purpose:** The puzzle itself. Single-page React component (`PuzzleApp`) mounted full-bleed.

**Component:** see `puzzle-app.jsx` and `themes.jsx`. The component is **fully theme-token driven** — same JSX, different theme = different look. Production should reproduce this token discipline.

**Structure (desktop):**
- Header: logo (clickable to Landing) + dateline ("Vol. III · No. 147"). Right side: Time pill, Streak pill (`23 ◆`), and an XP bar with "Lvl 5 / 240/500" label
- Puzzle body, padded `T.pad`px:
  - Title (38–42px serif 500)
  - Prompt (1–3 paragraphs, the data line gets a slight monospace treatment)
  - Hints stack (animated in one-by-one as the user reveals them; each in a paper card with "Hint N" label)
  - Spacer / scroll region — when many hints are revealed this is the only scrollable area
- Pinned bottom block:
  - Input zone — text input or 2/4-column choice grid depending on `puzzle.type`
  - Actions row — Hint / Skip / Submit / Notes (Notes hidden on mobile)
  - Post-solve panel (appears after solve or skip): "Nicely done." + stats + "Read the worked solution →" button → `Solution.html?from=solved&time=3:42&hints=1`
- Scratchpad: slide-in right column (desktop only), persists in localStorage per-puzzle

**Compact (mobile) variant:** When `window.innerWidth < 720`, PuzzleApp receives `compact={true}`. This merges mobile overrides into the theme:
- pad: 18, measure: 560
- choiceCols: 2 (was 4)
- title: 30 (was 42), prompt: 16.5 (was 19), data: 18 (was 22)
- Header simplifies: drops the XP bar visualization, condenses to "logo / time · streak" inline tabular text
- Notes button hidden

**State** (currently inline React useState; should be lifted to your store):
- `idx` (which puzzle if multi-puzzle day; the production app uses single puzzle)
- `answer` — the user's current input
- `status` — `'idle' | 'correct' | 'wrong' | 'revealed'`
- `attempts` — number of wrong submissions
- `hintLevel` — 0..3
- `streak`, `xp`, `level`, `xpPct` — gamification state
- `elapsed` — seconds since component mount (or since user first focused — production decides)
- `solved` — `{ [puzzleId]: true }`
- `shaking`, `burst` — animation triggers
- `showScratch`, `scratch` — scratchpad

**On correct submit:** sets status, increments streak/xp, calls `chime('correct')` (Web Audio), and writes `localStorage['puddle.daily'] = { date, state: 'solved', time, hints, attempts, title, issueNo }`. The Landing page reads this on next visit and flips the card.

**On skip (give up):** sets status to `'revealed'` and writes `{ state: 'revealed', title, issueNo, answer }`.

**Chime:** soft two-note Web Audio chime — see `chime()` in puzzle-app.jsx. Sine wave, gentle envelope. `correct` is brighter, `wrong` is a single muted low note, `hint` is a soft tick.

### 3. About.html

**Purpose:** Editorial column about what puddle is and who edits it.

**Layout:** centered single column (max-width 620px), section-rules separating subsections. Just running prose in serif body type with the standard masthead + footer chrome. Inline links to Submit and Contact.

### 4. SignIn.html

**Purpose:** One-click Google sign-in.

**Layout:** centered stage, max-width 460px. Kicker "A formality" + 60px italic-mix title "Sign in to *the* column." + single large Google button (`Continue with Google`, 360px max-width, paper bg with full 4-color Google G mark SVG inline). Below: italic muted foot note explaining what's actually stored.

**Loading state:** Click → button gains `.loading` class which shows a spinner and updates the label to "Connecting to Google…" then "Signed in. Loading…" then `window.location.href = 'Puzzle.html'`. Currently mocked with `setTimeout`; replace with real Google Identity Services.

### 5. Submit.html

**Purpose:** Reader puzzle submission. Editor sees the queue server-side and chooses what to run.

**Form fields (all required unless noted):**
- **the puzzle** section:
  - Title (text, maxlength 64)
  - Prompt (textarea, multi-paragraph)
  - Answer (text, exact)
  - Input style (select: free text / numeric / multiple choice)
  - Hints 1, 2, 3 (text, all optional, numbered badges)
  - **Solution walkthrough** (textarea, 160px tall, required — the explanation that will be edited into Solution.html)
- **about the puzzle** section:
  - Genre (select: Logic / Deduction / Quant / Sequences / Lateral riddle / Wordplay)
  - Difficulty (custom 5-dot stepper, arrow-key + click, labels: gentle / medium / hard / spicy / wicked)
  - Source (text, optional)
- **you** section:
  - Name (text, required)
  - Email (email, required)
  - Notes (textarea, optional)

**Success state:** sage check, "Thanks — I'll read it." headline, body echoing the submitter's email, two ghost actions (Back / Submit another).

### 6. Solution.html

**Purpose:** Worked solution for one puzzle. Reusable per-puzzle template.

**Layout:**
- Masthead + a small "← back to the puzzle" link below the rule
- Article head: kicker "Worked solution" + italic puzzle number/genre + 64px title + italic sub
- Outcome banner: reads `?from=solved` vs `?from=revealed` from query string
  - solved: sage check + "Nicely done. You solved it in 3:42 with 1 hint. Here's the canonical path."
  - revealed: muted dot + "The answer was 17. This is the puzzle whose first guess is almost always wrong — here's why."
  - none: muted dot + spoiler warning
- Body article (620px max-width, 18.5px serif body, 1.65 line-height):
  - 1–2 paragraphs of lede prose (the wrong instinct + key insight)
  - **"The path"** italic accent eyebrow + numbered editorial step cards (each shows a step number in 28px italic accent, the step body, and the cumulative time on the right). A dashed rule below + "Total elapsed: 17 min"
- End CTA: italic note ("Tomorrow's puzzle drops at midnight · 14h 23m from now.") + ink primary button "Back to the column →"

Per puzzle, the editor only needs to write 1–2 lede paragraphs and 2–5 numbered steps with timings. Everything else is template.

### 7. Profile.html

**Purpose:** The user's solving record. Editorial-styled but reads like a quiet dashboard.

**Layout (max-width 720px content area):**
- **Identity strip**: 84px circle avatar (italic "rk" initials), 46px name, italic meta line ("Solving since February 2026 · 87 puzzles attempted · 71 days active"). On the right, a level card with XP bar
- **By the numbers** section: 5 stat tiles in one wide hairline-split card. Each tile: italic label, 34px stat value (with smaller italic unit suffix), italic foot note
- **Solving calendar**: GitHub-style heatmap. Day labels (Mon/Wed/Fri) on the left, month labels floating above, columns = weeks, rightmost column = current week. Cells are 14×14px with 3px gap. States:
  - `solved` — full accent
  - `solved-with-hint` — accent at 0.55 opacity
  - `gave-up` — ink-muted at 0.5 opacity
  - `future` — transparent with dashed hair-strong border
  - default empty — paper-deep
  - JS computes the displayed cells dynamically based on container width (16–52 weeks). See the script in Profile.html.
- **Lower two-column grid (1.15fr / 1fr)**:
  - Recent (left): last 8 puzzles in a table — date, title, time, hints used. Sage "solo" badge for unaided solves. Empty days show "— didn't play"
  - By genre (right): bar chart of solves per genre, capped to the leading category

### 8. Settings.html

**Purpose:** Account and preferences.

**Three sections** (separated by italic-rule headers):

- **account**: Display name (text input, autosaves on debounce), Email (read-only "Linked through your Google account."), Member since (read-only)
- **experience**: Sound effects (toggle, default on), Hint pacing (segmented: Instant / 5s pause), Show streak counter (toggle, default on)
- **data**: Delete account (danger button → confirmation dialog), Sign out (ghost link)

**Persistence:** all changes write to `localStorage['puddle.settings']` immediately. A small "● Saved." toast slides up from the bottom for 1.4s on every change.

**Toggle switch:** 46×26px, paper-deep off / rust accent on. 20px round knob with shadow `0 1px 2px rgba(58,47,34,.2)` translates 18px horizontally.

**Delete confirmation:** scrim (rgba(58,47,34,.4)) + dialog (paper, 18px radius, 460px max-width). "Delete your account?" + body + Cancel (ghost) + "Yes, delete everything" (danger). Dismissible by Escape, backdrop click, or Cancel.

### 9. 404.html

**Purpose:** Editorial not-found.

**Layout:** centered stage. A massive italic serif **404** (340px, paper-deep color) sits behind the headline content with `margin-top: -60px` overlap. Above the headline: kicker "An issue we never printed". Title: *"This page doesn't appear in our archive."*. Sub paragraph explaining ("old link…", "future we haven't gotten to…"). Two CTAs: primary "Read today's puzzle →" + ghost "Back to the column".

---

## Interactions & Behavior

### Navigation flow

```
Landing → Puzzle (solve/skip) → write localStorage.daily
                              ↘ Solution?from=solved|revealed → Landing
Landing reads localStorage.daily on load → flips card to solved/revealed state

Sign in → Google OAuth → Puzzle
Profile → links via masthead
Settings → links via masthead, modifies localStorage.settings
404 → primary CTA → Puzzle
```

### Animations

- **Tab/section transitions:** 0.18s ease, all properties
- **Button hover:** `transform: translateY(-1px)` + shadow rise (0.18s)
- **Arrow icons in buttons:** `transform: translateX(3px)` on parent hover (0.25s)
- **Card reveal/post-solve:** `pa-{theme.id}-reveal` keyframe — translateY(10px → 0) + opacity 0→1 over 0.42s
- **Difficulty stepper dot scale:** `transform: scale(1.15)` on hover (0.15s)
- **Today stamp pulse:** opacity + scale loop, 2.2s infinite

### Form validation

- Submit form: first missing required field gets focused and flashes a rust border for 1.4s before reverting
- Sign in: button disabled until email regex passes (`/.+@.+\..+/`)
- Email input on Submit: HTML5 `type="email"`

### Accessibility minimums

- Custom toggles: `role="switch"` + `aria-checked` syncs with state
- Difficulty stepper dots: `role="radio"` + arrow-key + Enter/Space
- Delete dialog: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Logo links and back links have ARIA labels
- Skip links not currently included — production should add one

### Responsive breakpoints

- **≤980px** (Landing): single-column body grid, smaller hero title, masthead nav hidden
- **≤960px** (Profile): single-column lower grid, stats 2×2, identity stacks vertically
- **≤720px** (most pages): masthead nav hidden, titles drop 30–40%, form rows stack
- **≤520px** (Landing fine detail): logo wordmark 22px, hero 42px, lede meta wraps with dividers hidden, card numeral shrinks to 200px

### PuzzleApp on phone

The `compact` prop merges in smaller theme values. Detect with `window.innerWidth < 720` and recompute on resize. See `Puzzle.html`'s mounting code for the exact pattern.

---

## State Management

The current prototype uses **only localStorage** as a stand-in for a backend. The real app needs:

### Auth state
- Currently: none (mocked sign-in does a setTimeout and redirects)
- Real: Google OAuth via Google Identity Services (`google.accounts.id.initialize` + token verification on backend). On successful verify, set a session cookie (HTTP-only, secure, sameSite=lax).

### Today's puzzle outcome
- Currently: `localStorage['puddle.daily']` = `{ date, state: 'solved'|'revealed', time, hints, attempts, title, issueNo, answer }`
- Real: server-side per-user per-puzzle row in DB. Read on every Landing/Puzzle/Solution page load. The localStorage flow can stay as an *optimistic cache* but truth lives server-side.

### Profile data
- Currently: hardcoded in Profile.html JS (76 solved, 87 attempted, etc.)
- Real: server-side aggregate from the user's solve history. Calendar heatmap takes a list of `{date: 'YYYY-MM-DD', state: 'solved'|'solved-with-hint'|'gave-up'}` covering the visible window.

### Settings
- Currently: `localStorage['puddle.settings']`
- Real: per-user table, write-through on every change. Keep the optimistic localStorage cache for instant UI.

### Recommended schema (Postgres)

```sql
users            (id, google_sub, display_name, email, created_at)
puzzles          (id, issue_no, vol, date_active, title, genre, difficulty, prompt[], answer, hints[], solution_steps[])
solves           (user_id, puzzle_id, status, elapsed_seconds, hints_used, attempts, solved_at)  -- PK (user_id, puzzle_id)
submissions      (id, submitter_email, submitter_name, payload jsonb, created_at, status)
user_settings    (user_id, sound, show_streak, hint_pacing, display_name)
```

### Daily puzzle release

- Releases anchored to **midnight ET** (`America/New_York`)
- Server returns "today's puzzle" based on its own NY-clock query
- Cron job at 00:00:01 ET archives yesterday's stats and reveals tomorrow's metadata

---

## Backend Requirements

**Recommended stack:**
- **Frontend:** Next.js (App Router) + Tailwind CSS + Crimson Pro from Google Fonts
- **Auth:** NextAuth.js with Google provider, or Auth.js, or roll your own with Google Identity Services
- **DB:** Supabase or Neon (Postgres). Both have generous free tiers.
- **Hosting:** Vercel
- **Email:** none yet (delivery toggles deliberately removed from Settings until needed)

**Why this stack:**
- The site is mostly server-rendered editorial content with one interactive widget. Next.js SSR is ideal for the OG meta tags + initial render of the puzzle card state.
- Tailwind makes the design tokens above one-to-one mappable into a config (set `theme.extend.colors.ink = '#3a2f22'` etc.)
- Supabase free tier covers easily 10k users for a daily puzzle.

**Implementation order (suggested):**
1. Project scaffold + Tailwind config from design tokens
2. Shared layout (Masthead + Footer)
3. Static pages first: About, 404, SignIn UI (no real auth yet)
4. Puzzle data model + a hardcoded "puzzle of the day"
5. Puzzle component (port from puzzle-app.jsx — biggest piece of work)
6. Landing page with all three card states
7. Real Google OAuth
8. Solves persistence (DB writes)
9. Profile + Settings
10. Solution page template
11. Submit form (with server-side email-to-editor on submit, or insert to DB queue)

---

## Assets

- `favicon.svg` — 2×2 puzzle-tile mark in ink + rust
- `og-default.png` — 1200×630 editorial OG share card (cream bg, mark, wordmark, tagline)

No photographic imagery in the design. The visual system relies entirely on type, hairline rules, and the puzzle-tile mark.

---

## Files in This Bundle

| File | Purpose |
|---|---|
| `Landing.html` | Front door with today's puzzle teaser card (3 states) |
| `Puzzle.html` | Standalone puzzle play page (mounts PuzzleApp) |
| `About.html` | Editorial about page |
| `SignIn.html` | Google-only sign-in |
| `Submit.html` | Reader puzzle submission form |
| `Solution.html` | Worked-solution walkthrough template |
| `Profile.html` | User's solving record |
| `Settings.html` | Account and preferences |
| `404.html` | Editorial not-found page |
| `puzzle-app.jsx` | The PuzzleApp React component (token-driven, all logic) |
| `themes.jsx` | The EDITORIAL theme token bundle (only one used in prod) |
| `index.html` | A design-canvas showing all three puzzle puzzles for reference |
| `favicon.svg` | 2×2 tile favicon |
| `og-default.png` | 1200×630 OG share card |

The HTML files are largely self-contained — each has its own `<style>` block and a minimal `<script>` for state. The visual tokens are duplicated across them; in production, lift them into one Tailwind config or one CSS file.

---

## Caveats & Notes for the Developer

- **Editorial fictions to replace with real data:**
  - "12,481 solving today" — needs a real concurrent-solvers count
  - "best time so far 1:42" — needs aggregation
  - "Vol. III · No. 147" — drives off the actual issue number (days since launch + 1)
  - "Today — May 27" — derive from server's NY date
  - "avg. 4:12 to solve" — aggregate
  - All Profile.html numbers — replace with real user aggregates

- **The PuzzleApp component is dense.** ~700 lines of token-driven JSX. Worth porting carefully — every theme value matters. Don't try to inline-replace styles; keep the theme-token discipline.

- **The chime function uses Web Audio.** It instantiates `AudioContext` lazily on first invocation (browsers require user gesture). The pattern is in `puzzle-app.jsx` — copy it.

- **Mobile is a real constraint.** The user expects most puddlers to solve on phone. The compact variant is implemented; treat it as load-bearing, not as an afterthought.

- **The post-solve flow is what makes the product feel personal.** Don't skip the localStorage handoff to Landing — it's what gives the site a sense of memory without needing a server roundtrip.
