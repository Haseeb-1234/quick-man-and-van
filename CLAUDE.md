# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Next.js dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint

npx prisma generate        # Regenerate Prisma client after schema changes
npx prisma migrate dev     # Apply migrations in development
npx prisma studio          # Open DB browser UI
```

There is no test suite. TypeScript strict mode is on — `npm run build` catches type errors.

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, PostgreSQL via Prisma, Stripe Checkout, Resend email, Upstash Redis for rate limiting.

### Booking flow

The core user journey is a 4-step wizard at `/move/[stage]` rendered by `src/components/quote/MoveWizard.tsx`. The URL segment drives the `step` state; navigation uses `window.history.pushState` (no full page transitions).

Steps: **1 Route** → **2 Move details** → **3 Contact info** → **4 Quotes + Book**

API sequence when a user books:
1. `POST /api/quotes` — computes quotes from pricing rules, no DB write.
2. `POST /api/bookings` — validates input, re-runs pricing to enforce minimum hours, creates a `PENDING` Booking with a random `checkoutToken` UUID.
3. `POST /api/stripe/checkout` — verifies booking status is PENDING and `checkoutToken` matches, re-derives price and rejects if drift > 1%, creates a Stripe Checkout Session (or returns the existing open one idempotently).
4. `POST /api/webhooks/stripe` — receives `checkout.session.completed`, verifies amount matches stored price within £0.02, transitions booking to `CONFIRMED`, sends confirmation email via Resend.

### Pricing (`src/lib/pricing.ts`)

Van types are integers 0–3 (Small £25/hr → Luton £55/hr). Four hardcoded "providers" apply an `hourlyAdjust` to the base rate. Helpers 0–1 are free; 2 adds £12/hr, 3 adds £24/hr. Stairs cost £5/flight, extra stops £10 each. Min booking is 5 hours, max 17.5.

`recomputeBookingPrice()` re-derives the minimum possible price from persisted booking fields using the cheapest applicable provider — this is the price drift check run at checkout time.

### Geo services (`src/lib/geo-services.ts`)

Switchable via `GEO_PROVIDER` env var:
- `"free"` (default): Photon API for autocomplete, OSRM for routing. No API keys needed, suitable for local dev. Both have `// TODO: Replace` comments marking them as not production-ready.
- `"google"`: Google Places autocomplete + Distance Matrix routing. Requires `GOOGLE_MAPS_SERVER_API_KEY` (server) and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client).

Fallback when routing fails: Haversine straight-line distance at 45 km/h average.

Address suggestions are encoded as base64url JSON (`encodeAddress`/`decodeAddress`) and used as the `id` field, allowing the full `AddressLeg` object to round-trip through URL search params and the address autocomplete API without a separate DB lookup.

### Validation (`src/lib/validators/quote.ts`)

All API routes validate with Zod. `addressLegSchema` requires finite lat/long coordinates. `stopLegSchema` allows blank rows (empty `addr`) but requires coordinates if `addr` is non-empty. `hasCoordsValidationError()` is used to surface the `COORDS_REQUIRED_MESSAGE` specifically, so the UI can tell the user they must select from the autocomplete dropdown rather than freetyping.

### Middleware (`src/middleware.ts`)

Runs on all `/api/*` routes. Enforces:
- **CORS**: Cross-origin requests to `/api/*` are rejected with 403 unless the origin matches `NEXT_PUBLIC_BASE_URL` or `NEXTAUTH_URL`.
- **Rate limiting**: Requires Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`). Silently skips if Redis is unconfigured. Limits: quotes 60/60s, addresses 30/60s, bookings and checkout 10/60s each.

### Key env vars

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `GEO_PROVIDER` | `"free"` or `"google"` |
| `GOOGLE_MAPS_SERVER_API_KEY` | Server-side geo (required if google) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side geo (required if google) |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (optional) |
| `NEXT_PUBLIC_BASE_URL` | Production domain — must not contain `localhost` in production or Stripe checkout throws |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth (used as CORS/base URL fallback) |

### Path aliases

`@/*` maps to `src/*` — use `@/lib/...`, `@/components/...`, `@/types/...` throughout.
