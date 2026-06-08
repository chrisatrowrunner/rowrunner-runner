# RowRunner — Runner Dispatch App

> Claim it. Run it. Repeat.

The **venue-staff** companion to the [RowRunner fan ordering app](../rowrunner).
Runners use this on their phones, on their feet, to claim fan orders and deliver
them. It's a separate app on purpose — different users, different context, a
fast task-focused UI instead of a menu browser — tied to the fan app only by the
**shared Supabase backend**.

| | |
|---|---|
| **Brand** | Navy `#072E48` · Ice Blue `#5BB8D4` / `#87CEEB` (matches the fan app) |
| **Stack** | React 18 + TypeScript + Vite — same as the fan app |
| **Backend (shared)** | Supabase (the same project the fan app writes to) |
| **Form factor** | Mobile-first installable PWA |

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle in dist/
npm run preview    # preview the production build
```

Requires **Node.js 18+**. Out of the box the queue is fed by **real fan orders**
via the shared [edge server](../rowrunner-edge) (`VITE_EDGE_URL`, default
`http://localhost:4000`) over live SSE — place an order in the fan app and it
appears here instantly. Start all three: `rowrunner-edge`, the fan app, and this.

Sign in with **any** email + password (auth is still a local demo — try
`sarah.lee@venue.com`). To work offline against a local simulator instead of the
edge, set `VITE_USE_MOCK=1`.

---

## The flow — 4 screens

1. **Login** — email/password. No sign-up; runners are provisioned. Session
   persists across refreshes (localStorage).
2. **Queue** (home) — live feed of unclaimed orders, **oldest-first**. Each card
   shows the seat big and bold, an item summary, the pickup stand, and a live
   age timer that warms **ice → amber → red** as an order waits. New orders pop
   in via the realtime feed. Tap **Claim**.
3. **Active order** — the one order you own (one at a time in the MVP, so this
   replaces the queue until you deliver). Seat front and center, full item list
   with quantities/options, and where to pick it up. Tap **Mark as delivered**.
4. **Delivered** — brief success state, then auto-bounces back to the queue.

The order **stage** (`0 received · 1 preparing · 2 picked up · 3 on the way ·
4 delivered`) is the *same* lifecycle the fan app's status tracker reads, so one
shared row drives both apps. Claiming moves an order to stage 2; delivering to 4.

## Project structure

```
src/
  main.tsx            app entry (+ prod service-worker registration)
  App.tsx             router shell + toast
  index.css           design tokens — identical to the fan app
  types.ts            domain types (RunnerOrder, Seat, Stand, …)
  data/seed.ts        local simulator data  (← stand-in for the Supabase feed)
  lib/orders.ts       backend seam: RunnerOrdersApi + mock impl + Supabase ref
  lib/auth.ts         staff sign-in seam (mock localStorage + Supabase ref)
  store/store.tsx     session, routing, live feed, claim/deliver actions
  components/         Icon, ui kit (header, CTA, dock, tag, seat pill)
  screens/           Login, Queue, Active, Delivered
public/
  manifest.webmanifest  PWA manifest
  sw.js                 app-shell service worker (registered in prod only)
  assets/               RowRunner logos (shared with the fan app)
```

## Data flow

```
fan app  ──POST /orders──▶  rowrunner-edge  ──SSE /events──▶  runner app (queue)
                                  ▲                                  │
                                  └────────  PATCH /orders/:id  ◀────┘
                                            (claim → stage 2, deliver → stage 4)
```

`src/lib/orders.ts` is the single data seam: it talks to the edge by default,
falls back to the local simulator with `VITE_USE_MOCK=1`, and documents the
Supabase swap. `src/data/seed.ts` is only used in mock mode.

## Supabase (the production backend)

Already wired in `src/lib/orders.ts` (queue/claim/deliver + realtime) and
`src/lib/auth.ts` (staff login). It activates automatically when the two
`VITE_SUPABASE_*` vars are set — otherwise the app uses the edge/mock fallback.
Setup:

1. Create a Supabase project (supabase.com).
2. **SQL Editor ▸ New query** → paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**. Creates `orders`, enables Realtime, sets RLS.
3. **Authentication ▸ Users ▸ Add user** → create a runner login (email + password, "Auto Confirm"). Runners don't self-register.
4. **Project Settings ▸ API** → copy the **Project URL** and **anon public** key into `.env` (both apps, same project).
5. Restart the dev servers. The fan app now inserts orders into Supabase and the runner reads/claims them over Realtime; the edge server is no longer needed.

The screens never touch data sources directly, so none of them change when you
switch backends. `isMockMode` (true when Supabase isn't configured) drives the
demo hint on the login screen — it disappears once real auth is on.

## Decisions

- **Two states, not three tabs.** No "in progress" tab (one active order = one
  screen) and no history tab (an operator concern, not a runner-on-the-floor
  one). Easier to train, easier to debug during a pilot. Revisit if a debrief
  shows runners need it, or if you let runners hold multiple orders at once.
- **Legibility over decoration.** Big seat type, high contrast, minimal taps —
  it's read while walking.
