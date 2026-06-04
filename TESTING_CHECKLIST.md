# Testing Checklist

Use this checklist manually first, then convert the critical items into Playwright/API tests.

## Setup

- [ ] Install dependencies with `npm install`.
- [ ] Configure `.env` with at least `DATABASE_URL` and `GEO_PROVIDER=free`.
- [ ] Run Prisma migration against local PostgreSQL.
- [ ] Start app with `npm run dev -- --hostname 127.0.0.1 --port 3000`.
- [ ] Open `http://127.0.0.1:3000`.

## Critical Quote Flow

- [ ] Homepage renders with quote widget.
- [ ] Collection address autocomplete appears after 3+ characters.
- [ ] Delivery address autocomplete appears after 3+ characters.
- [ ] Selecting an address fills visible input.
- [ ] `/move` receives homepage address query params.
- [ ] `/move` route step shows collection and delivery blocks.
- [ ] Post code, street address, and city map to the correct read-only fields.
- [ ] Typed but unselected address is rejected.
- [ ] Valid selected collection and delivery addresses allow Next.
- [ ] Step 2 shows min price banner.
- [ ] Step 2 shows estimated journey duration.
- [ ] Van size cards select correctly.
- [ ] Helper cards select correctly.
- [ ] Hours dropdown accepts 5 to 17.5.
- [ ] Date input rejects past date through API validation.
- [ ] Passenger message updates when helpers change.
- [ ] Step 3 shows name, email, phone, and message fields.
- [ ] Empty contact fields are rejected.
- [ ] Invalid email is rejected by API.
- [ ] Final submit shows quote cards.
- [ ] Quote cards are sorted cheapest first.
- [ ] Book Now creates a pending booking when DB is connected.

## Stop Points

- [ ] Home checkbox creates one stop point on `/move`.
- [ ] Add stop point button adds stops up to 3.
- [ ] Fourth stop cannot be added.
- [ ] Remove stop works.
- [ ] Stop address autocomplete works.
- [ ] Stop with typed but unselected text is rejected.
- [ ] Stops affect route distance/duration when selected.

## API Checks

- [ ] `POST /api/quotes` with valid payload returns 200.
- [ ] `POST /api/quotes` with malformed JSON returns 400 `invalid_json`.
- [ ] `POST /api/quotes` with missing coords returns 400.
- [ ] `POST /api/bookings` with valid payload creates booking.
- [ ] `POST /api/bookings` with invalid contact details returns 400.
- [ ] `POST /api/stripe/checkout` without Stripe config returns 503.
- [ ] `POST /api/stripe/checkout` with wrong checkout token returns 403.
- [ ] Stripe webhook without signature returns 400.
- [ ] Stripe webhook with invalid signature returns 400.
- [ ] Stripe webhook with valid test event confirms a pending booking.

## Edge Cases

- [ ] Very long address term does not crash autocomplete.
- [ ] Empty API bodies return validation errors.
- [ ] Coordinates with strings/null/invalid numbers are rejected.
- [ ] `hours` below 5 and above 17.5 are rejected.
- [ ] `helpers` outside 0-3 is rejected.
- [ ] `vantype` outside 0-3 is rejected.
- [ ] Invalid date like `31/02/2026` is rejected.
- [ ] Invalid time like `24:00` is rejected.
- [ ] Contact fields with HTML/script payloads render as escaped text.
- [ ] Duplicate checkout creation reuses existing open Stripe session.
- [ ] Confirmed booking cannot start checkout again.

## Responsive and Browser

- [ ] Chrome desktop: full quote flow.
- [ ] Edge desktop: full quote flow.
- [ ] Firefox desktop: full quote flow.
- [ ] iPhone Safari: dropdowns, date/time, mobile nav.
- [ ] Android Chrome: dropdowns, touch targets, scrolling.
- [ ] Long addresses wrap without layout overflow.
- [ ] Buttons remain tappable on mobile.
- [ ] Date/time inputs are usable on mobile.

## Performance

- [ ] Lighthouse homepage score reviewed.
- [ ] Lighthouse `/move` score reviewed.
- [ ] `/api/quotes` average latency measured.
- [ ] Address lookup handles slow Photon response gracefully.
- [ ] OSRM outage falls back to haversine.
- [ ] With Upstash configured, route limits return 429 when exceeded.

## Deployment Smoke

- [ ] Production `NEXT_PUBLIC_BASE_URL` is not localhost.
- [ ] Production Stripe keys are set.
- [ ] Stripe webhook secret is set.
- [ ] Resend sender domain is configured.
- [ ] Upstash Redis rate limiting is configured.
- [ ] Database migrations have run.
- [ ] `/move/success` works after Stripe test payment.
