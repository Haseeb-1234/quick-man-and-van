# QA, Security, and Admin Audit

Date: 2026-05-29

## App Understanding Report

### What This App Does

This is a public customer-facing Man & Van quote and booking website built with Next.js App Router. The main workflow is an instant quote wizard where a visitor selects collection and delivery addresses, optional stops, stairs, van size, helpers, move date/time, contact details, then receives mock provider quotes and can start Stripe Checkout.

Evidence:
- Frontend pages live under `src/app/(main)`.
- The quote wizard lives in `src/components/quote/MoveWizard.tsx`.
- Address entry is handled by `src/components/quote/AddressBlock.tsx`.
- Quote, booking, Stripe, webhook, and address APIs live under `src/app/api`.
- Persistent data models are in `prisma/schema.prisma`.

### Frontend Framework and Structure

- Framework: Next.js App Router with React 19 and TypeScript.
- Styling: Tailwind CSS v4 plus custom CSS variables/classes in `src/app/globals.css`.
- Main public layout: `src/app/(main)/layout.tsx`, with `Navbar` and `Footer`.
- Homepage sections:
  - `src/components/home/Hero.tsx`
  - `QuickQuoteWidget.tsx`
  - `HowItWorks.tsx`
  - `ReviewsSection.tsx`
  - `ServicesSection.tsx`
  - `CityLinks.tsx`
- Quote flow:
  - `/move` renders `MoveWizard` initial step 1.
  - `/move/[stage]` renders `MoveWizard initialStep={stage}` for stages 1-4.
  - `/move/success` verifies a Stripe session id if Stripe is configured.

### Backend Framework and Structure

- Backend is Next.js Route Handlers, not a separate server.
- API routes:
  - `GET /api/addresses/autocomplete`
  - `GET /api/addresses/detail`
  - `POST /api/quotes`
  - `POST /api/bookings`
  - `POST /api/stripe/checkout`
  - `POST /api/webhooks/stripe`
- Middleware: `src/middleware.ts` applies CORS checks and optional Upstash rate limiting to `/api/*`.

### Database and Query Layer

- Database: PostgreSQL, configured through Prisma.
- ORM/query layer: Prisma Client with `@prisma/adapter-pg` and `pg`.
- Prisma config: `prisma.config.ts`.
- Schema: `prisma/schema.prisma`.
- Models:
  - `Customer`
  - `Booking`
  - enum `BookingStatus`
- `Customer` is currently not used by the booking API; bookings store contact fields directly.

### Authentication System

No active authentication system was found in the app.

Evidence:
- `next-auth` is installed in `package.json`, but `rg` found no `getServerSession`, `signIn`, `auth`, auth route, login page, register page, role model, or admin route.
- There are no protected pages or authenticated APIs.

Implication: login/register/logout and role-based tests are not applicable yet. Any future admin panel needs auth built first.

### API Routes and Endpoints

| Endpoint | File | Purpose | Auth |
|---|---|---|---|
| `GET /api/addresses/autocomplete?term=` | `src/app/api/addresses/autocomplete/route.ts` | Returns address suggestions from the active geo provider | Public |
| `GET /api/addresses/detail?id=` | `src/app/api/addresses/detail/route.ts` | Decodes an address suggestion id into address details | Public |
| `POST /api/quotes` | `src/app/api/quotes/route.ts` | Validates quote request and returns journey, min price, provider quotes | Public |
| `POST /api/bookings` | `src/app/api/bookings/route.ts` | Validates customer quote request and creates a pending booking | Public |
| `POST /api/stripe/checkout` | `src/app/api/stripe/checkout/route.ts` | Creates/reuses Stripe Checkout session for a pending booking | Public with `checkoutToken` |
| `POST /api/webhooks/stripe` | `src/app/api/webhooks/stripe/route.ts` | Verifies Stripe webhook and confirms paid bookings | Stripe signature |

### Main Business Entities and Resources

Current persisted entities:
- `Booking`: route, stops JSON, stairs, date/time, van size, helpers, price, Stripe ids, checkout token, status, contact fields.
- `Customer`: email/name/phone, but currently not created or linked by the quote flow.

Runtime-only entities:
- Address suggestions and address legs.
- Quote requests.
- Driver/provider quote results. These are hardcoded in `src/lib/pricing.ts` (`PROVIDERS`) and not stored in the database.

### External Services and Third-Party APIs

| Service | File | Purpose | Required for local testing |
|---|---|---|---|
| Photon by Komoot | `src/lib/geo-services.ts` | Free address lookup when `GEO_PROVIDER=free` | No key |
| OSRM public server | `src/lib/geo-services.ts` | Free route distance/duration when `GEO_PROVIDER=free` | No key |
| Google Maps APIs | `src/lib/geo-services.ts` | Production geo provider when `GEO_PROVIDER=google` | Google key |
| Stripe | `src/lib/stripe.ts`, checkout route, webhook route | Payment checkout and confirmation | Optional until booking payment is tested |
| Resend | `src/lib/resend.ts`, `booking-email.ts` | Confirmation email after paid webhook | Optional |
| Upstash Redis | `src/middleware.ts` | Rate limiting | Optional, but important in production |
| Google Fonts | `src/app/globals.css` | Remote fonts | Browser network |
| Reviews.io | `QuickQuoteWidget.tsx` | External review link | Link only |

There are also legacy or unused service modules:
- `src/lib/getaddress-server.ts`
- `src/lib/postcodes.ts`

### Environment Variables and Config

Documented in `.env.example`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GEO_PROVIDER`
- `GOOGLE_MAPS_SERVER_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Used but not documented in `.env.example`:
- `NEXT_PUBLIC_BASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Existing Tests

No formal test framework is configured.

Evidence:
- No Jest, Vitest, Cypress, or Playwright config files were found.
- `package.json` has no `test` script.
- `booking-test.js` exists but is untracked and not integrated into npm scripts. It is a manual Playwright script targeting `localhost:3001`.

### Logging and Error Handling Patterns

- API handlers return compact error codes like `invalid_json`, `validation_error`, `quote_failed`.
- Some server-side errors are logged with `console.error`, for example booking creation, Stripe checkout creation, webhook amount mismatch, and Resend failures.
- Client-side UI shows user-friendly generic errors in `MoveWizard`.
- There is no structured logger, request id, error boundary strategy, or observability integration.

### Deployment and Runtime Assumptions

- Next.js app deployable to Vercel or any Node runtime supporting Next.js.
- PostgreSQL is required for booking persistence.
- `DATABASE_URL` must be set for APIs importing Prisma.
- Production payments require `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and a non-localhost `NEXT_PUBLIC_BASE_URL` or `NEXTAUTH_URL`.
- Rate limiting only works if Upstash Redis env vars are configured. Without them, middleware silently skips limiting.

### Core User Roles

Actual roles in code:
- Anonymous visitor/customer only.
- Stripe webhook actor for payment confirmation.

Not present:
- Admin user.
- Driver/provider user.
- Customer account user.
- Role/permission model.

### Core Workflows

1. Homepage quote widget:
   - Select collection and delivery addresses.
   - Optional stairs/stops flags.
   - Navigate to `/move` with query params.

2. Full quote wizard:
   - Step 1 route and stops.
   - Step 2 van size, hours, helpers, date/time.
   - Step 3 contact details.
   - Step 4 quote results.

3. Booking and payment:
   - User clicks Book now.
   - `POST /api/bookings` creates pending booking and checkout token.
   - `POST /api/stripe/checkout` validates token and creates Stripe Checkout session.
   - Stripe webhook confirms booking and sends email if Resend is configured.

### Critical Data Models

`Booking` is the critical model. It contains PII, payment identifiers, status, route details, pricing, and checkout token.

Critical fields:
- `contactEmail`, `contactName`, `contactPhone`
- `collectionAddress`, `deliveryAddress`, postcodes, stops JSON
- `price`, `bookedHours`, `bookedVanType`
- `checkoutToken`, `stripeSessionId`, `stripePaymentId`
- `status`

### Critical APIs

Highest business risk:
- `POST /api/bookings`: creates persisted records and stores PII.
- `POST /api/stripe/checkout`: starts payment and must prevent tampering.
- `POST /api/webhooks/stripe`: confirms paid bookings.
- `POST /api/quotes`: pricing and route calculations.

### High-Risk Areas

- No formal automated tests.
- No active authentication or admin controls.
- Public booking creation can spam database if Upstash is not configured.
- Rate limiting is optional and silently disabled without env vars.
- No CSP header yet.
- No structured audit log for booking/payment state changes.
- Hardcoded provider quotes in pricing logic.
- Production geo provider requires Google key but falls back only when `GEO_PROVIDER=free`.
- `Customer` model exists but is not wired to booking creation, which may confuse reporting/admin work.
- Untracked `.agents/`, `.claude/`, screenshots, and `booking-test.js` should not be committed until reviewed.

## Prioritized Testing Roadmap

### Critical First

1. Quote wizard happy path from `/` and `/move`.
2. Address autocomplete selection and hidden address mapping.
3. Quote calculation with route duration and min price.
4. Booking creation with valid contact details.
5. Stripe checkout token validation and price drift protection.
6. Stripe webhook signature verification and idempotent confirmation.
7. API validation and malformed JSON handling.
8. Rate limiting behavior in a configured environment.

### High Next

1. Stop points add/remove up to 3 stops.
2. Date validation for past and invalid dates.
3. Mobile layout and touch behavior.
4. Network failures from Photon/OSRM/Google/Stripe/Resend.
5. Data persistence accuracy in PostgreSQL.
6. Accessibility issues, including disabled zoom in `src/app/layout.tsx`.

### Medium

1. Static content pages.
2. City pages.
3. Contact links and footer/nav.
4. SEO metadata.
5. Browser compatibility.

## Functional Test Cases

| Priority | Test | Steps | Expected Result | Risk If It Fails | Type |
|---|---|---|---|---|---|
| Critical | Homepage quote entry | Open `/`, select collection and delivery, click Get quotes | Navigates to `/move?...` with prefilled route | Users cannot start quote from homepage | E2E |
| Critical | Direct quote route | Open `/move`, select both addresses, click Next | Moves to step 2 and shows min price | Core funnel blocked | E2E |
| Critical | Address mapping | Select a Photon result with postcode/street/city | Read-only fields show correct postcode, street, city | Wrong quote and customer confusion | E2E/integration |
| Critical | Address validation | Type text but do not select dropdown, click Next | Shows address selection error | Invalid coordinates enter pricing | E2E |
| Critical | Move details | Select each van/helper, hours/date/time, continue | Step 3 loads and selections affect quote request | Incorrect pricing inputs | E2E/unit |
| Critical | Contact required fields | Leave name/email/phone blank, submit | Error shown, no quote results | Bad PII or empty bookings | E2E |
| Critical | Booking creation | Complete flow and click Book now with Stripe off | Booking API creates pending booking; checkout returns `stripe_not_configured` | Cannot persist leads | Integration |
| Critical | Stripe configured checkout | With Stripe test key, click Book now | Redirects to Stripe Checkout | Revenue flow broken | E2E |
| Critical | Stripe webhook success | Send signed `checkout.session.completed` event | Booking moves from PENDING to CONFIRMED | Paid bookings not confirmed | Integration |
| High | Stop point support | Add 3 stops, select addresses, remove one, continue | Stops included/excluded correctly | Wrong route and price | E2E |
| High | Past date | Select yesterday, submit to quote API | API returns validation error | Impossible bookings accepted | Integration |
| High | Invalid stage route | Open `/move/0`, `/move/5`, `/move/abc` | 404 | Broken routing / weird states | E2E |
| Medium | Static pages | Visit FAQ, size guide, moving tips, legal pages | Pages render without console errors | Brand/content quality issue | Smoke |

Login/register/logout, role-based behavior, file uploads, search/filter/sort, and admin actions are not applicable because no such features exist in code.

## Integration Test Cases

| Priority | Test | Steps | Expected Result | Risk If It Fails |
|---|---|---|---|---|
| Critical | `/api/quotes` valid body | POST complete valid `QuoteRequest` | Returns journey, minHours, minPrice, sorted quotes | Pricing flow broken |
| Critical | `/api/quotes` malformed JSON | POST invalid JSON | 400 `invalid_json` | API crashes on bad input |
| Critical | `/api/bookings` valid body | POST complete booking body with DB connected | Creates PENDING booking with contact fields and checkoutToken | Lead capture broken |
| Critical | `/api/stripe/checkout` bad token | Use valid booking id with wrong token | 403 `booking_not_available` | Unauthorized payment/session access |
| Critical | Webhook invalid signature | POST webhook without valid Stripe signature | 400 `Invalid signature` | Fake confirmations possible |
| High | OSRM failure fallback | Mock OSRM failure | Uses haversine fallback | Quote wizard fails on routing outage |
| High | Photon failure | Mock autocomplete failure | API returns 502 with empty suggestions | UI should handle lookup outage |
| High | DB failure on booking | Stop DB or use bad URL | API returns 500 `create_failed` without leaking stack | Error handling/data safety |
| Medium | CORS enforcement | Send API request from unlisted `Origin` | 403 | Browser cross-origin abuse |

## Edge Case Testing

- Empty address term, 1-2 character address term, 120+ character term.
- Typed but unselected address.
- Coordinates as strings, null, NaN, Infinity, swapped lat/long.
- Stop point with address but no coordinates.
- More than 3 stops submitted directly to API.
- `hours` below 5, above 17.5, non-number.
- `helpers` below 0, above 3.
- `vantype` outside 0-3.
- Invalid dates: `31/02/2026`, past date, bad format.
- Invalid time: `24:00`, `09:99`, bad format.
- Very long name/email/phone/message.
- Invalid email and short phone.
- Script/HTML payloads in contact fields and addresses, for local testing only:
  - `<script>alert(1)</script>`
  - `<img src=x onerror=alert(1)>`
  - `"><svg onload=alert(1)>`
- Duplicate checkout attempts for the same booking.
- Booking already `CONFIRMED` then checkout attempted again.
- Stripe amount mismatch in webhook.
- Expired or missing checkout token.
- Slow or failing third-party APIs.

## Performance Test Plan

| Area | Test | Tool |
|---|---|---|
| Page load | Lighthouse on `/`, `/move`, `/move/1` | Lighthouse, browser devtools |
| Quote API latency | 50-200 repeated `/api/quotes` calls with representative addresses | k6 |
| Address autocomplete latency | Burst address searches, including slow Photon responses | k6, Playwright |
| Booking writes | Concurrent booking creation against test DB | k6, database query logs |
| Stripe checkout | Repeated checkout creation for same booking id | Integration test with Stripe test mode |
| DB growth | Seed 10k bookings and query future admin list | Prisma scripts, DB analyzer |
| Rate limiting | Exceed route limits with Upstash configured | k6 |
| Memory | Run long dev/prod session with repeated quote searches | Node inspector, devtools |

Recommended first k6 scenarios:
- 20 virtual users browsing `/move` and posting `/api/quotes`.
- 5 virtual users creating bookings.
- 60 requests/minute to `/api/addresses/autocomplete` from one IP to verify 429 when Upstash is configured.

## Cross-Browser and Device Checklist

Critical:
- Chrome desktop: full quote and Stripe test flow.
- Edge desktop: full quote flow.
- iPhone Safari: address dropdown, date/time inputs, mobile nav, Stripe redirect.
- Android Chrome: address dropdown, touch targets, scrolling through wizard.

High:
- Firefox desktop: layout and forms.
- Safari desktop: date/time input fallback behavior.

Specific checks:
- Address dropdown position and click selection.
- Clear buttons in inputs.
- Add/remove stops on touch screens.
- Native date/time controls.
- Long addresses do not overflow.
- Stripe redirect and return.
- Mobile nav close behavior.
- Browser zoom and accessibility; current layout sets `userScalable: false`, which should be revisited.

## Security Audit Checklist and Findings

### Input Validation and Sanitization

Evidence:
- API validation uses Zod in `src/lib/validators/quote.ts`.
- Client validation exists in `MoveWizard.tsx`, but API validation is the source of truth.
- Email HTML escapes persisted booking data in `src/lib/booking-email.ts`.

Risks:
- Public address/detail APIs accept arbitrary search terms/ids, though bounded.
- `message` is accepted and stored only in client payload, but not persisted currently.
- Stops are stored as JSON from validated fields.

How to test:
- Submit payloads directly to `/api/quotes` and `/api/bookings` with invalid types, long strings, script strings, missing coordinates.

### Authentication and Authorization

No app authentication exists. This is acceptable for an anonymous quote funnel but blocks any safe admin panel.

Risks:
- No admin controls can be safely added until admin auth and role checks exist.
- Booking creation is public by design and must rely on validation, rate limits, monitoring, and anti-spam controls.

### API Security

Good:
- CORS origin enforcement exists in `src/middleware.ts`.
- Stripe checkout requires a per-booking `checkoutToken`.
- Stripe webhook verifies signature.
- Security headers exist in `next.config.ts`.

Risks:
- Rate limiting is skipped if Upstash env vars are absent.
- No Content-Security-Policy.
- Error responses are mostly generic, but server logs may contain raw errors.

### SQL Injection / NoSQL Injection

Prisma calls use structured APIs:
- `prisma.booking.create`
- `prisma.booking.findUnique`
- `prisma.booking.update`
- `prisma.booking.updateMany`

No raw SQL string concatenation was found in `src`.

Risk level: low currently.

### XSS

Good:
- React escapes rendered strings by default.
- No `dangerouslySetInnerHTML` was found.
- Email content escapes user/persisted fields.

Risks:
- If future admin pages render booking stops/messages as HTML, stored XSS could be introduced.
- CSP is missing.

Safe local test payloads:
- `<script>alert(1)</script>`
- `<img src=x onerror=alert(1)>`
- `"><svg onload=alert(1)>`

### CSRF

Current CSRF risk is limited because:
- There is no authenticated cookie-based user session.
- APIs use JSON bodies.
- CORS blocks unlisted browser origins.

CSRF becomes important if:
- Admin auth uses cookies.
- Booking management APIs are added.
- Customer accounts are added.

Future fix: add CSRF tokens or same-site protected server actions for authenticated mutating admin routes.

### Data Exposure

Risks:
- Booking APIs store PII: name, email, phone, addresses.
- No admin/reporting privacy boundaries exist yet.
- `.env` is ignored, but local `.env` exists and must never be committed.
- Untracked `.agents/` and `.claude/` folders should be reviewed before any commit.
- Success page accepts `session_id` from query and checks Stripe payment status, but does not expose booking details.

### Dependency Vulnerabilities

Recommended commands:
- `npm audit`
- `npm outdated`
- `npx osv-scanner .`
- Enable Dependabot on GitHub.

Do not blindly upgrade Next/React/Prisma without running quote and Stripe regression tests.

### Environment Variables and Secrets

Cleanup plan:
1. Keep `.env` ignored.
2. Add missing env names to `.env.example`: `NEXT_PUBLIC_BASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
3. Use separate development, preview, and production keys.
4. Store production secrets only in hosting provider secret manager.
5. Rotate any key ever pasted into chat, committed, or screenshot.
6. Review untracked agent folders before pushing.

## Security Findings Table

| Finding | Severity | File/location | Why It Matters | How To Reproduce/Test | Recommended Fix | Safe To Patch Now |
|---|---|---|---|---|---|---|
| No formal automated tests | High | `package.json`, repo root | Core quote/payment flow can regress silently | Run `npm test`; no script exists | Add Playwright E2E and API integration tests | Yes |
| Rate limiting silently disabled without Upstash | High | `src/middleware.ts` | Public quote/booking APIs can be spammed | Remove Upstash env vars and flood `/api/bookings` | In production, fail deployment or warn loudly when rate limit env missing | Yes, with env policy decision |
| No authentication/admin foundation | High | No auth routes/models found | Admin panel would be unsafe without roles | Search for auth usage; none | Add NextAuth/admin user model before admin APIs | Not without requirements |
| Missing CSP | Medium | `next.config.ts` | XSS blast radius is larger | Inspect response headers | Add report-only CSP first, then enforce | Yes, carefully |
| Public booking creation stores PII before payment | Medium | `src/app/api/bookings/route.ts` | Spam and privacy/data-retention risk | POST many valid bookings | Add rate limit, retention policy, optional captcha/honeypot | Yes |
| `Customer` model unused | Medium | `prisma/schema.prisma`, booking API | Reporting/admin assumptions can be wrong | Create booking; no customer row linked | Either wire customer up or remove until needed | Needs product decision |
| Missing env documentation | Medium | `.env.example`, `middleware.ts` | Production may run with wrong base URL/rate limits | Compare env usage to example | Add missing env vars to `.env.example` | Yes |
| Disabled user zoom | Low | `src/app/layout.tsx` | Accessibility issue on mobile | Inspect viewport metadata | Remove `maximumScale` and `userScalable: false` | Yes |
| Untracked generated folders | Low/Medium | `.agents/`, `.claude/` | May contain noise or accidental sensitive files | Review before commit | Add to `.gitignore` if local-only | Yes |

## Admin Panel Recommendation

This app most closely resembles a booking/scheduling app with payment, not SaaS, e-commerce, content platform, or marketplace yet. The provider quotes are hardcoded, so it is not a true marketplace in code today.

### Manageable Entities

| Entity | Status | Classification |
|---|---|---|
| Bookings | Exists in DB | Essential now |
| Customers | Model exists, not wired | Useful soon |
| Provider quotes/drivers | Hardcoded only | Useful soon |
| Payments | Stripe ids on bookings | Essential now |
| Coupons/discounts | Not present | Avoid for now |
| Users/admins/roles | Not present | Essential before admin launch |
| Logs/audit trail | Not present | Useful soon |
| App settings | Code/env only | Useful soon |
| Content pages | Static code | Nice-to-have |
| Uploaded files | Not present | Avoid for now |
| API keys | Env only | Avoid editable admin UI |

### Diagnostic Answers

1. Admin users are not defined in code.
2. Admins need to fix stuck bookings, wrong contact details, failed payment confirmations, and customer support questions.
3. Pending bookings and payment mismatch events need review.
4. No user-generated public content exists, so moderation is not needed.
5. Business settings that may change: provider rates, minimum hours, service cities, contact numbers, geo provider, Stripe/Resend status.
6. Needed support logs: booking timeline, checkout session id, webhook events, email send status.
7. Dangerous actions: cancel booking, mark confirmed/completed, refund-related actions, editing price after checkout.
8. Bookings need search/filter/export.
9. Booking status changes and settings should be role-restricted.
10. Secrets/API keys should never be editable from the admin panel.

### Lightweight Admin Modules

| Module | Purpose | Access | Fields/actions | Filters/search | Audit | Priority | Complexity | Risk If Poorly Built |
|---|---|---|---|---|---|---|---|---|
| Bookings | Support and operations | Admin/support | View, status update, contact edit, notes | Status, date, email, postcode, booking id | Yes | Critical | Medium | PII exposure, bad status changes |
| Payments | Debug checkout/webhook | Admin/finance | View Stripe ids, paid status, retry webhook note | Status, date, Stripe session id | Yes | Critical | Medium | Incorrect payment handling |
| Customers | Find repeat customers | Admin/support | View linked bookings, contact correction | Email, phone | Yes | High after wiring | Medium | Privacy leaks |
| Provider/rates | Replace hardcoded providers | Admin/ops | Rates, van max, active/inactive | Active, van type | Yes | High | Medium | Pricing errors |
| Audit log | Trace dangerous changes | Admin only | Read-only timeline | Actor, booking, action | It is the audit | High | Medium | No accountability |
| Settings health | Operational status | Admin only | Read-only env/service status | None | No | Medium | Low | Secret exposure if built badly |
| Content editor | Edit static pages | Marketing | Page text | Page name | Optional | Low | High | Scope creep |

Immediate admin MVP:
1. Add admin auth and role model.
2. Add booking list/detail.
3. Add booking status transitions with audit log.
4. Add payment/webhook event visibility.
5. Keep settings read-only.

## Immediate Next Steps

1. Add Playwright config and E2E tests for homepage to quote results.
2. Add API integration tests for quote, booking, checkout token, and webhook signature behavior.
3. Document missing env vars in `.env.example`.
4. Decide whether `.agents/`, `.claude/`, screenshots, and `booking-test.js` are local-only; usually they should be ignored.
5. Add production deployment guardrails for rate limiting, base URL, Stripe, and webhook configuration.
6. Design admin auth before building any admin UI.
