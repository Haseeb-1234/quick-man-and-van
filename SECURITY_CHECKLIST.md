# Security Checklist

This checklist is specific to the current Next.js Man & Van booking app.

## Current Security Posture

- [x] Zod validation exists for quote and booking APIs.
- [x] Stripe webhook signature verification exists.
- [x] Stripe checkout uses a per-booking `checkoutToken`.
- [x] Basic security headers are configured in `next.config.ts`.
- [x] CORS origin enforcement exists for `/api/*`.
- [ ] No authentication system is active.
- [ ] No admin authorization exists.
- [ ] No formal automated security tests exist.
- [ ] No CSP is enforced.
- [ ] Rate limiting is skipped unless Upstash env vars are set.

## Input Validation

- [ ] Test `/api/quotes` with missing collection/delivery.
- [ ] Test `/api/quotes` with typed-but-unselected address.
- [ ] Test `/api/quotes` with more than 3 stops.
- [ ] Test invalid `vantype`, `helpers`, `hours`, `date`, and `time`.
- [ ] Test `/api/bookings` with invalid name/email/phone.
- [ ] Test extremely long contact fields.
- [ ] Test script/HTML payloads locally:
  - `<script>alert(1)</script>`
  - `<img src=x onerror=alert(1)>`
  - `"><svg onload=alert(1)>`
- [ ] Confirm user-controlled values are escaped anywhere they render.

## Authentication and Authorization

- [ ] Do not build admin routes until admin auth exists.
- [ ] Add an admin user model or trusted auth provider before admin UI.
- [ ] Protect all future `/admin` pages server-side.
- [ ] Protect all future admin APIs server-side.
- [ ] Add role checks for dangerous actions.
- [ ] Add audit logs for booking/payment status changes.

## API Security

- [ ] Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production.
- [ ] Verify 429 responses for `/api/bookings`, `/api/quotes`, address autocomplete, and Stripe checkout.
- [ ] Verify cross-origin API requests from untrusted origins return 403.
- [ ] Keep error responses generic.
- [ ] Avoid returning stack traces or raw DB errors.
- [ ] Add request ids and structured logging before production support load increases.

## Stripe Security

- [ ] Use Stripe test mode locally and preview.
- [ ] Use live keys only in production secret storage.
- [ ] Verify webhook signature with `STRIPE_WEBHOOK_SECRET`.
- [ ] Confirm paid amount matches stored booking price.
- [ ] Keep checkout token unguessable and single-purpose.
- [ ] Do not expose `STRIPE_SECRET_KEY` to client bundles.
- [ ] Confirm `NEXT_PUBLIC_BASE_URL` is production domain before taking payments.

## Data Protection

- [ ] Treat bookings as PII because they contain names, emails, phones, and addresses.
- [ ] Avoid logging full request bodies.
- [ ] Avoid exporting bookings without access control.
- [ ] Add retention policy for abandoned pending bookings.
- [ ] Review screenshots before sharing; they may contain personal addresses.
- [ ] Review `.agents/` and `.claude/` before committing.
- [ ] Keep `.env` ignored.

## XSS

- [ ] Keep avoiding `dangerouslySetInnerHTML`.
- [ ] Escape any user data inserted into email HTML.
- [ ] Add Content-Security-Policy in report-only mode first.
- [ ] Test script payloads in address/contact fields.
- [ ] If an admin panel is added, render notes/messages as plain text only.

## CSRF

- [ ] Current anonymous JSON APIs have low CSRF risk.
- [ ] If cookie-based admin auth is added, add CSRF protection.
- [ ] Use SameSite cookies for authenticated admin sessions.
- [ ] Require POST plus CSRF token for admin mutations.

## Database Safety

- [x] Prisma structured queries are used.
- [ ] Avoid raw SQL unless parameterized.
- [ ] Add indexes needed for admin booking search.
- [ ] Add migration review before production deploys.
- [ ] Back up database before destructive migrations.

## Dependency and Supply Chain

- [ ] Run `npm audit`.
- [ ] Run `npm outdated`.
- [ ] Consider `npx osv-scanner .`.
- [ ] Enable Dependabot.
- [ ] Review new packages before adding them.
- [ ] Remove unused dependencies if confirmed unused.

## Environment and Secrets

- [ ] Add missing env docs for `NEXT_PUBLIC_BASE_URL`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.
- [ ] Use separate dev/preview/prod secrets.
- [ ] Rotate any secret ever committed or pasted.
- [ ] Never store production secrets in code, screenshots, docs, or admin settings.
- [ ] Confirm no `NEXT_PUBLIC_*` variable contains a secret.

## Recommended Patches

- [ ] Add Playwright E2E tests.
- [ ] Add API integration tests.
- [ ] Add missing env vars to `.env.example`.
- [ ] Add `.agents/`, `.claude/`, local screenshots, and local Playwright artifacts to `.gitignore` if they are local-only.
- [ ] Add CSP report-only header.
- [ ] Remove mobile `userScalable: false` unless there is a strong reason.
