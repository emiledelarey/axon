# Axon

Paste any study material → daily practice loop: spaced-repetition flashcards,
error-classified micro-lessons, Socratic tutor, and Live Work problem coach.

Built on Next.js 16 (App Router) + Anthropic Claude Sonnet 4.5. Ships on
Vercel.

## Local development

```bash
npm install
cp .env.example .env.local        # then paste your ANTHROPIC_API_KEY
npm run dev                       # http://localhost:3000
```

Without a key, API routes return 500 and the client falls back to the
built-in demo responses — you can still navigate the whole app.

## Tests

```bash
npm test                          # vitest: lib + API route unit/integration (37 cases)
npm run test:e2e                  # playwright: core study flow against a production build
npx tsc --noEmit                  # strict typecheck
npm run build                     # full Next production build
```

## Deploying to Vercel (preview)

Run these yourself — they need an interactive browser login and touch
shared infra:

```bash
npm install -g vercel             # one-time
vercel login                      # browser SSO
cd axon                           # this directory
vercel                            # first run sets up the project; accept defaults
vercel env add ANTHROPIC_API_KEY  # paste your key; select Production, Preview, Development
vercel                            # redeploy preview with the key
```

The CLI prints a preview URL like `axon-<hash>.vercel.app`. Open it, run
through onboarding, generate a deck, study — the three API routes should
be live.

To promote the preview to production (`axon.study`), run `vercel --prod`.

## Project layout

```
src/
  app/
    layout.tsx                  # root: fonts (Fraunces, IBM Plex, JetBrains Mono), providers
    page.tsx                    # / — onboarding landing
    globals.css                 # design tokens + keyframes + utility classes
    api/
      generate-cards/route.ts   # POST → 10 cards from material (+focus/notes)
      classify-error/route.ts   # POST → error diagnosis + 90s micro-lesson
      chat/route.ts             # POST → SSE stream for tutor + livework
    (app)/
      layout.tsx                # sidebar + topbar + feedback shell
      dashboard/page.tsx        # Today
      study/page.tsx            # Daily Study (+ MicroLesson + SessionComplete)
      coach/page.tsx            # Live Work
      tutor/page.tsx            # Tutor Chat
      library/page.tsx          # Decks
      cohort/page.tsx           # Leaderboard (stub data)
      roadmap/page.tsx          # Public roadmap
  components/
    providers/                  # AppStateProvider, PasteModalContext
    ui/                         # Btn, Chip, StatTile, Icon map, AxonMark, Spinner, Hairline
    shell/                      # Sidebar, Topbar, DeckPicker, FeedbackButton
    modals/PasteMaterialModal.tsx
    onboarding/Onboarding.tsx, OnboardingStep.tsx
  lib/
    api.ts                      # typed fetch helpers + file://-safe fallbacks
    api-types.ts                # request/response shapes shared server↔client
    claude.ts                   # SDK client, rate limit, JSON extractor (server-only)
    cohort.ts                   # stub leaderboard data
    constants.ts                # MODELS, STORAGE_KEY, LIMITS
    state.ts                    # AppState, deck helpers, migrations, useLocalState
test/stubs/                     # vitest shims (server-only)
e2e/                            # playwright specs
```

## What's explicitly NOT here (by design, for this session)

- Auth (localStorage is the account). Clerk goes in a later session.
- Database. Cross-device sync goes in a later session.
- The Q3 2026 features (Voice Mode, Live Write, Mock Exam) — see
  `../axon-docs/perplexity-brief-q3-2026.md`.
