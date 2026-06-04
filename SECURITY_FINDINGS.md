# Security Findings Verification

Date: 2026-05-29

Scope inspected:
- `src/app/api/addresses/autocomplete/route.ts`
- `src/app/api/addresses/detail/route.ts`
- `src/app/api/quotes/route.ts`
- `src/app/api/bookings/route.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/middleware.ts`
- `src/lib/validators/quote.ts`
- `src/lib/geo-services.ts`
- `src/lib/pricing.ts`
- `next.config.ts`

## Public API Route Security Matrix

| Route path | HTTP method | Authentication required | Input validation mechanism | Rate limiting present | Abuse scenarios | Security findings | Severity |
|---|---|---:|---|---|---|---|---|
| `/api/addresses/autocomplete` | `GET` | No | Manual `term` trim and length check: 3-120 chars | Conditional: `/api/addresses/autocomplete`, 30/min only if Upstash env vars exist | Enumeration, third-party Photon/Google quota/cost abuse, repeated lookup load | Public by design, but limiting silently disables without Redis | Medium |
| `/api/addresses/detail` | `GET` | No | Requires `id`; `decodeAddress()` base64-decodes and Zod-validates address | No route-specific limit in `LIMITS` | Large `id` payload CPU/memory pressure, address detail decode abuse | Missing rate limit and missing max length on `id` | Medium |
| `/api/quotes` | `POST` | No | `quoteRequestSchema.safeParse(body)` | Conditional: `/api/quotes`, 60/min only if Upstash env vars exist | Route/pricing compute spam, OSRM/Google routing abuse, malformed JSON spam | Strong Zod validation, but public and rate limit optional | High |
| `/api/bookings` | `POST` | No | `createBookingSchema.safeParse(body)` | Conditional: `/api/bookings`, 10/min only if Upstash env vars exist | Database spam, PII storage spam, lead pollution, repeated quote recomputation | Creates persistent PII record for anonymous users; returns checkout token | High |
| `/api/stripe/checkout` | `POST` | No account auth; requires booking id + checkout token | `checkoutBodySchema.safeParse(body)` | Conditional: `/api/stripe/checkout`, 10/min only if Upstash env vars exist | Brute force booking/token pairs, repeated Stripe calls, checkout probing | Token check is good; generic error prevents booking id enumeration after validation | Medium |
| `/api/webhooks/stripe` | `POST` | Stripe signature required | Stripe `constructEvent(raw, sig, whSecret)` | No route-specific limit in `LIMITS` | Unsigned request flood, repeated expensive signature checks, body-size abuse | Signature verification is good; missing rate limit | Medium |

Rate limiting evidence:

```ts
// src/middleware.ts
const LIMITS: { prefix: string; max: number }[] = [
  { prefix: "/api/bookings", max: 10 },
  { prefix: "/api/stripe/checkout", max: 10 },
  { prefix: "/api/addresses/autocomplete", max: 30 },
  { prefix: "/api/quotes", max: 60 },
]
```

```ts
// src/middleware.ts
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  sharedRedis ??= new Redis({ url, token })
  return sharedRedis
}
```

```ts
// src/middleware.ts
if (!limiter) {
  // Redis not configured — skip limiting (development / initial deploy)
  return NextResponse.next()
}
```

## Top 10 Highest-Risk Vulnerabilities

### 1. Public booking creation can be abused to spam the database and store PII

Severity: High

File path:
- `src/app/api/bookings/route.ts`

Affected code:

```ts
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = createBookingSchema.safeParse(body)
```

```ts
const booking = await prisma.booking.create({
  data: {
    collectionAddress: data.collection.addr,
    collectionPostcode: data.collection.postcode,
    deliveryAddress: data.delivery.addr,
    deliveryPostcode: data.delivery.postcode,
    stops: data.stops,
    ...
    contactEmail: data.clientemail,
    contactName: data.clientname?.trim() || null,
    contactPhone: data.clientphone?.trim() || null,
    checkoutToken,
    status: "PENDING",
  },
})
```

How an attacker would exploit it:
- Send repeated valid JSON payloads to `POST /api/bookings`.
- Each request creates a persistent `PENDING` booking with contact PII fields.
- If Upstash Redis is not configured, there is no effective route limit.

Business impact:
- Database growth and cost.
- Polluted operations/admin data.
- Fake leads and fake customer records.
- PII compliance burden for junk records.
- Potential service degradation from repeated `computeQuotes()` and DB writes.

Recommended fix:
- Enforce production rate limiting; do not silently skip it in production.
- Add bot friction for booking creation, such as Turnstile/hCaptcha or a server-side honeypot.
- Add pending-booking retention cleanup.
- Consider creating bookings only after the customer chooses a quote and passes stronger abuse checks.

### 2. Rate limiting is optional and silently disabled when Upstash env vars are missing

Severity: High

File path:
- `src/middleware.ts`

Affected code:

```ts
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  sharedRedis ??= new Redis({ url, token })
  return sharedRedis
}
```

```ts
const limiter = getRatelimiter(rule.max)
if (!limiter) {
  // Redis not configured — skip limiting (development / initial deploy)
  return NextResponse.next()
}
```

How an attacker would exploit it:
- If production lacks `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`, send high-volume requests to `/api/bookings`, `/api/quotes`, `/api/stripe/checkout`, or `/api/addresses/autocomplete`.
- The middleware passes all requests through.

Business impact:
- API and DB resource exhaustion.
- Third-party API abuse.
- Stripe checkout abuse.
- Fake booking spam.

Recommended fix:
- In production, return 503 or fail startup/deploy when rate limiting env vars are missing.
- Add `/api/addresses/detail` and `/api/webhooks/stripe` to `LIMITS`.
- Add monitoring for 429s and request rates.

### 3. `/api/quotes` can be used to abuse routing providers and server compute

Severity: High

File paths:
- `src/app/api/quotes/route.ts`
- `src/lib/pricing.ts`
- `src/lib/geo-services.ts`

Affected code:

```ts
// src/app/api/quotes/route.ts
const parsed = quoteRequestSchema.safeParse(body)
...
const result = await computeQuotes(parsed.data)
return NextResponse.json(result)
```

```ts
// src/lib/pricing.ts
export async function computeQuotes(input: QuoteRequest): Promise<{
  journey: Awaited<ReturnType<typeof getJourneySummary>>
  minHours: number
  minPrice: number
  quotes: DriverQuote[]
}> {
  const legs = [input.collection, ...input.stops, input.delivery]
  const journey = await getJourneySummary(legs)
```

```ts
// src/lib/geo-services.ts
for (let i = 0; i < usable.length - 1; i += 1) {
  const leg = await osrmLeg(usable[i], usable[i + 1])
  distanceMeters += leg.distanceMeters
  durationSeconds += leg.durationSeconds
}
```

How an attacker would exploit it:
- POST valid payloads with collection, delivery, and up to 3 stops.
- Each request can trigger multiple route calculations.
- If `GEO_PROVIDER=google`, this can burn paid Google Maps Distance Matrix quota.
- If `GEO_PROVIDER=free`, this hits shared OSRM infrastructure and consumes server time.

Business impact:
- Increased third-party API cost in production Google mode.
- Slow quote pages for real users.
- Potential serverless function cost/timeouts.

Recommended fix:
- Keep `/api/quotes` rate-limited in production.
- Cache route summaries by rounded coordinate pairs.
- Require a short-lived quote session token from address selection before route calculation.
- Add per-IP and per-session quotas.

### 4. `/api/addresses/detail` has no rate limit and no max `id` length

Severity: Medium

File paths:
- `src/app/api/addresses/detail/route.ts`
- `src/lib/geo-services.ts`
- `src/middleware.ts`

Affected code:

```ts
// src/app/api/addresses/detail/route.ts
const id = searchParams.get("id")
if (!id) {
  return NextResponse.json({ error: "missing_id" }, { status: 400 })
}

const resolved = decodeAddress(id)
```

```ts
// src/lib/geo-services.ts
export function decodeAddress(id: string): AddressLeg | null {
  try {
    const raw: unknown = JSON.parse(Buffer.from(id, "base64url").toString("utf8"))
    const result = addressLegSchema.safeParse(raw)
    return result.success ? result.data : null
  } catch {
    return null
  }
}
```

```ts
// src/middleware.ts
const LIMITS: { prefix: string; max: number }[] = [
  { prefix: "/api/bookings", max: 10 },
  { prefix: "/api/stripe/checkout", max: 10 },
  { prefix: "/api/addresses/autocomplete", max: 30 },
  { prefix: "/api/quotes", max: 60 },
]
```

How an attacker would exploit it:
- Send very large `id` query strings to `/api/addresses/detail`.
- The route attempts base64 decode and JSON parse before rejecting.
- Repeat without hitting any route-specific limiter.

Business impact:
- CPU/memory pressure.
- Increased serverless duration/cost.
- Reduced availability for real users.

Recommended fix:
- Add an `id.length` maximum before decode, for example 2048 chars.
- Add `/api/addresses/detail` to `LIMITS`.
- Consider using signed, compact ids instead of base64-encoded full address JSON.

### 5. Stripe webhook route is not rate-limited

Severity: Medium

File paths:
- `src/app/api/webhooks/stripe/route.ts`
- `src/middleware.ts`

Affected code:

```ts
// src/app/api/webhooks/stripe/route.ts
const raw = await req.text()

let event: Stripe.Event
try {
  event = stripe.webhooks.constructEvent(raw, sig, whSecret)
} catch {
  return new NextResponse("Invalid signature", { status: 400 })
}
```

```ts
// src/middleware.ts
const LIMITS: { prefix: string; max: number }[] = [
  { prefix: "/api/bookings", max: 10 },
  { prefix: "/api/stripe/checkout", max: 10 },
  { prefix: "/api/addresses/autocomplete", max: 30 },
  { prefix: "/api/quotes", max: 60 },
]
```

How an attacker would exploit it:
- Send repeated unsigned or invalidly signed POSTs to `/api/webhooks/stripe`.
- The route still reads the raw body and attempts signature verification.

Business impact:
- Server resource exhaustion.
- Noise in logs/monitoring.
- Possible webhook processing delays for legitimate Stripe events.

Recommended fix:
- Add `/api/webhooks/stripe` to rate limits.
- Keep Stripe signature verification.
- Optionally reject bodies above Stripe’s expected webhook size before reading deeply, where platform supports it.

### 6. Anonymous booking response exposes checkout token to the browser/client

Severity: Medium

File path:
- `src/app/api/bookings/route.ts`

Affected code:

```ts
return NextResponse.json({
  bookingId: booking.id,
  checkoutToken: booking.checkoutToken,
  price: booking.price,
})
```

How an attacker would exploit it:
- Create a booking through the public API and receive a valid checkout token.
- Use that token to call `/api/stripe/checkout`.
- This is currently the intended flow, but it means anyone can create checkout sessions for fake bookings.

Business impact:
- Stripe checkout session clutter.
- Fake operational records.
- Potential billing/support noise.

Recommended fix:
- Keep the token but make it short-lived.
- Store token creation/expiry fields.
- Rate-limit and bot-protect booking creation.
- Consider deferring DB persistence until checkout starts, or mark records clearly as unverified leads.

### 7. JSON body parsing has no route-local size guard

Severity: Medium

File paths:
- `src/app/api/quotes/route.ts`
- `src/app/api/bookings/route.ts`
- `src/app/api/stripe/checkout/route.ts`

Affected code:

```ts
// Pattern in multiple routes
let body: unknown
try {
  body = await req.json()
} catch {
  return NextResponse.json({ error: "invalid_json" }, { status: 400 })
}
```

How an attacker would exploit it:
- Send large JSON request bodies to public POST endpoints.
- The route attempts to parse the body before validation rejects field lengths/types.

Business impact:
- Memory pressure.
- Longer serverless execution times.
- Potential availability degradation.

Recommended fix:
- Check `content-length` before parsing and reject over a small limit, for example 32-64KB for quote/booking payloads.
- Add platform-level body limits where supported.
- Add request timeout protection if self-hosting.

### 8. No Content-Security-Policy header

Severity: Medium

File path:
- `next.config.ts`

Affected code:

```ts
headers: [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // TODO: Add Content-Security-Policy after auditing all inline scripts,
  // third-party src attributes (Stripe.js, Reviews.io widget), and font sources.
]
```

How an attacker would exploit it:
- If any reflected or stored XSS bug is introduced later, missing CSP makes script execution easier.
- Current code does not show `dangerouslySetInnerHTML`, so this is a defense-in-depth gap rather than a proven XSS.

Business impact:
- Higher blast radius from future XSS.
- Harder to meet stricter security expectations for payment-adjacent apps.

Recommended fix:
- Add `Content-Security-Policy-Report-Only` first.
- Include only required sources for self, Google Fonts, Stripe, and any real third-party widgets.
- Move to enforced CSP after checking reports.

### 9. Production payment route can hard-fail on base URL misconfiguration

Severity: Medium

File path:
- `src/app/api/stripe/checkout/route.ts`

Affected code:

```ts
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000"

if (process.env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
  throw new Error("NEXT_PUBLIC_BASE_URL must be set to the production domain before taking payments")
}
```

How an attacker would exploit it:
- This is not a direct attacker-controlled exploit unless environment is already misconfigured.
- If production is deployed with localhost base URL, every checkout attempt throws before a controlled JSON response.

Business impact:
- Payment flow outage.
- Unhandled server errors instead of graceful operational failure.

Recommended fix:
- Return a controlled `503 payment_misconfigured` response.
- Add deployment checks so production cannot start without `NEXT_PUBLIC_BASE_URL`.
- Add `NEXT_PUBLIC_BASE_URL` to `.env.example`.

### 10. Google geo provider key failure degrades address/quote APIs without operational guardrail

Severity: Medium

File path:
- `src/lib/geo-services.ts`

Affected code:

```ts
function geoProvider(): GeoProvider {
  return process.env.GEO_PROVIDER === "google" ? "google" : "free"
}
```

```ts
function googleKey(): string {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!key) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is required")
  return key
}
```

How an attacker would exploit it:
- This is a configuration weakness, not a direct external exploit.
- If production runs with `GEO_PROVIDER=google` and missing/invalid key, address autocomplete returns lookup failures and Google distance falls back only after exceptions.

Business impact:
- Quote funnel outage or degraded route accuracy.
- Lost bookings.

Recommended fix:
- Validate geo provider config at startup/deploy.
- Add a health endpoint for provider status.
- Keep `GEO_PROVIDER=free` only for local/demo, not production.

## Executable Local Penetration-Testing Commands

Assumptions:
- App is running at `http://127.0.0.1:3000`.
- Commands are safe local verification requests.
- On Windows PowerShell, use `curl.exe` to avoid the `curl` alias.

Set a base URL:

```powershell
$BASE="http://127.0.0.1:3000"
```

### 1. Address autocomplete rejects too-short terms

```powershell
curl.exe -i "$BASE/api/addresses/autocomplete?term=ab"
```

Expected:
- `200`
- `{"suggestions":[]}`

### 2. Address autocomplete performs public lookup

```powershell
curl.exe -i "$BASE/api/addresses/autocomplete?term=Westminster"
```

Expected:
- `200`
- JSON containing `suggestions` and `provider`.

### 3. Address autocomplete CORS rejects untrusted browser origin

```powershell
curl.exe -i "$BASE/api/addresses/autocomplete?term=Westminster" -H "Origin: https://evil.example"
```

Expected:
- `403` if middleware origin enforcement is active.

### 4. Address detail missing id

```powershell
curl.exe -i "$BASE/api/addresses/detail"
```

Expected:
- `400`
- `{"error":"missing_id"}`

### 5. Address detail invalid id

```powershell
curl.exe -i "$BASE/api/addresses/detail?id=not-base64-json"
```

Expected:
- `404`
- `{"error":"not_found"}`

### 6. Address detail large id pressure test

```powershell
$BIG="A" * 100000
curl.exe -i "$BASE/api/addresses/detail?id=$BIG"
```

Expected:
- Currently likely `404`, but this verifies the route accepts very large `id` input without a pre-decode length check.

### 7. Quote API malformed JSON

```powershell
curl.exe -i -X POST "$BASE/api/quotes" -H "Content-Type: application/json" --data "{bad json"
```

Expected:
- `400`
- `{"error":"invalid_json"}`

### 8. Quote API empty body validation

```powershell
curl.exe -i -X POST "$BASE/api/quotes" -H "Content-Type: application/json" --data "{}"
```

Expected:
- `400`
- `validation_error`.

### 9. Quote API rejects missing coordinates

```powershell
curl.exe -i -X POST "$BASE/api/quotes" -H "Content-Type: application/json" --data "{\"collection\":{\"addr\":\"Fake collect\",\"street\":\"\",\"city\":\"London\",\"postcode\":\"SW1A 2AA\",\"lat\":null,\"long\":null,\"stairs\":0},\"stops\":[],\"delivery\":{\"addr\":\"Fake deliver\",\"street\":\"\",\"city\":\"London\",\"postcode\":\"NW1 6XE\",\"lat\":51.523767,\"long\":-0.1585557,\"stairs\":0},\"vantype\":1,\"hours\":5,\"helpers\":1,\"date\":\"31/12/2026\",\"time\":\"09:00\",\"submitter\":\"submit\"}"
```

Expected:
- `400`
- `Valid address with coordinates required.`

### 10. Quote API accepts valid quote body

```powershell
curl.exe -i -X POST "$BASE/api/quotes" -H "Content-Type: application/json" --data "{\"collection\":{\"addr\":\"10 Downing Street, London, SW1A 2AA\",\"street\":\"10 Downing Street\",\"city\":\"London\",\"postcode\":\"SW1A 2AA\",\"lat\":51.5033635,\"long\":-0.1276248,\"stairs\":0},\"stops\":[],\"delivery\":{\"addr\":\"221B Baker Street, London, NW1 6XE\",\"street\":\"221B Baker Street\",\"city\":\"London\",\"postcode\":\"NW1 6XE\",\"lat\":51.523767,\"long\":-0.1585557,\"stairs\":0},\"vantype\":1,\"hours\":5,\"helpers\":1,\"date\":\"31/12/2026\",\"time\":\"09:00\",\"submitter\":\"submit\"}"
```

Expected:
- `200`
- JSON containing `journey`, `minHours`, `minPrice`, `quotes`.

### 11. Quote API rejects too many stops

```powershell
curl.exe -i -X POST "$BASE/api/quotes" -H "Content-Type: application/json" --data "{\"collection\":{\"addr\":\"10 Downing Street, London, SW1A 2AA\",\"street\":\"10 Downing Street\",\"city\":\"London\",\"postcode\":\"SW1A 2AA\",\"lat\":51.5033635,\"long\":-0.1276248,\"stairs\":0},\"stops\":[{\"addr\":\"Stop 1\",\"street\":\"\",\"city\":\"London\",\"postcode\":\"\",\"lat\":51.5,\"long\":-0.1,\"stairs\":0},{\"addr\":\"Stop 2\",\"street\":\"\",\"city\":\"London\",\"postcode\":\"\",\"lat\":51.51,\"long\":-0.11,\"stairs\":0},{\"addr\":\"Stop 3\",\"street\":\"\",\"city\":\"London\",\"postcode\":\"\",\"lat\":51.52,\"long\":-0.12,\"stairs\":0},{\"addr\":\"Stop 4\",\"street\":\"\",\"city\":\"London\",\"postcode\":\"\",\"lat\":51.53,\"long\":-0.13,\"stairs\":0}],\"delivery\":{\"addr\":\"221B Baker Street, London, NW1 6XE\",\"street\":\"221B Baker Street\",\"city\":\"London\",\"postcode\":\"NW1 6XE\",\"lat\":51.523767,\"long\":-0.1585557,\"stairs\":0},\"vantype\":1,\"hours\":5,\"helpers\":1,\"date\":\"31/12/2026\",\"time\":\"09:00\",\"submitter\":\"submit\"}"
```

Expected:
- `400`
- `validation_error`.

### 12. Booking API malformed JSON

```powershell
curl.exe -i -X POST "$BASE/api/bookings" -H "Content-Type: application/json" --data "{bad json"
```

Expected:
- `400`
- `{"error":"invalid_json"}`

### 13. Booking API rejects invalid contact data

```powershell
curl.exe -i -X POST "$BASE/api/bookings" -H "Content-Type: application/json" --data "{\"collection\":{\"addr\":\"10 Downing Street, London, SW1A 2AA\",\"street\":\"10 Downing Street\",\"city\":\"London\",\"postcode\":\"SW1A 2AA\",\"lat\":51.5033635,\"long\":-0.1276248,\"stairs\":0},\"stops\":[],\"delivery\":{\"addr\":\"221B Baker Street, London, NW1 6XE\",\"street\":\"221B Baker Street\",\"city\":\"London\",\"postcode\":\"NW1 6XE\",\"lat\":51.523767,\"long\":-0.1585557,\"stairs\":0},\"vantype\":1,\"hours\":5,\"helpers\":1,\"date\":\"31/12/2026\",\"time\":\"09:00\",\"submitter\":\"submit\",\"clientname\":\"A\",\"clientemail\":\"not-email\",\"clientphone\":\"1\"}"
```

Expected:
- `400`
- `validation_error`.

### 14. Booking API creates a pending booking with valid data

```powershell
curl.exe -i -X POST "$BASE/api/bookings" -H "Content-Type: application/json" --data "{\"collection\":{\"addr\":\"10 Downing Street, London, SW1A 2AA\",\"street\":\"10 Downing Street\",\"city\":\"London\",\"postcode\":\"SW1A 2AA\",\"lat\":51.5033635,\"long\":-0.1276248,\"stairs\":0},\"stops\":[],\"delivery\":{\"addr\":\"221B Baker Street, London, NW1 6XE\",\"street\":\"221B Baker Street\",\"city\":\"London\",\"postcode\":\"NW1 6XE\",\"lat\":51.523767,\"long\":-0.1585557,\"stairs\":0},\"vantype\":1,\"hours\":5,\"helpers\":1,\"date\":\"31/12/2026\",\"time\":\"09:00\",\"submitter\":\"submit\",\"clientname\":\"Security Test\",\"clientemail\":\"security-test@example.com\",\"clientphone\":\"07700900123\",\"selectedQuoteId\":\"swift\"}"
```

Expected:
- `200` if DB is connected.
- Response includes `bookingId`, `checkoutToken`, and `price`.
- This verifies anonymous booking creation and token return.

### 15. Booking API CORS rejects untrusted browser origin

```powershell
curl.exe -i -X POST "$BASE/api/bookings" -H "Origin: https://evil.example" -H "Content-Type: application/json" --data "{}"
```

Expected:
- `403`.

### 16. Stripe checkout malformed JSON

```powershell
curl.exe -i -X POST "$BASE/api/stripe/checkout" -H "Content-Type: application/json" --data "{bad json"
```

Expected:
- If Stripe is not configured: `503 {"error":"stripe_not_configured"}` because the route checks Stripe before JSON parsing.
- If Stripe is configured: `400 {"error":"invalid_json"}`.

### 17. Stripe checkout validation failure

```powershell
curl.exe -i -X POST "$BASE/api/stripe/checkout" -H "Content-Type: application/json" --data "{}"
```

Expected:
- If Stripe is not configured: `503`.
- If Stripe is configured: `400 validation_error`.

### 18. Stripe checkout wrong token

Replace `BOOKING_ID_HERE` with a real booking id from command 14:

```powershell
curl.exe -i -X POST "$BASE/api/stripe/checkout" -H "Content-Type: application/json" --data "{\"bookingId\":\"BOOKING_ID_HERE\",\"checkoutToken\":\"00000000-0000-0000-0000-000000000000\"}"
```

Expected:
- If Stripe is not configured: `503`.
- If Stripe is configured and booking exists: `403 {"error":"booking_not_available"}`.

### 19. Stripe webhook missing signature

```powershell
curl.exe -i -X POST "$BASE/api/webhooks/stripe" -H "Content-Type: application/json" --data "{}"
```

Expected:
- If Stripe or webhook secret is not configured: `503 Webhook not configured`.
- If configured: `400 Missing stripe-signature`.

### 20. Stripe webhook invalid signature

```powershell
curl.exe -i -X POST "$BASE/api/webhooks/stripe" -H "Content-Type: application/json" -H "stripe-signature: invalid" --data "{}"
```

Expected:
- If Stripe or webhook secret is not configured: `503`.
- If configured: `400 Invalid signature`.

### 21. Rate-limit verification loop for `/api/addresses/autocomplete`

This only proves rate limiting if Upstash env vars are configured.

```powershell
1..35 | ForEach-Object {
  curl.exe -s -o NUL -w "%{http_code}`n" "$BASE/api/addresses/autocomplete?term=Westminster"
}
```

Expected:
- With Upstash configured: eventually `429`.
- Without Upstash configured: likely all `200`, confirming the silent skip.

### 22. Rate-limit verification loop for `/api/quotes`

```powershell
$BODY="{\"collection\":{\"addr\":\"10 Downing Street, London, SW1A 2AA\",\"street\":\"10 Downing Street\",\"city\":\"London\",\"postcode\":\"SW1A 2AA\",\"lat\":51.5033635,\"long\":-0.1276248,\"stairs\":0},\"stops\":[],\"delivery\":{\"addr\":\"221B Baker Street, London, NW1 6XE\",\"street\":\"221B Baker Street\",\"city\":\"London\",\"postcode\":\"NW1 6XE\",\"lat\":51.523767,\"long\":-0.1585557,\"stairs\":0},\"vantype\":1,\"hours\":5,\"helpers\":1,\"date\":\"31/12/2026\",\"time\":\"09:00\",\"submitter\":\"submit\"}"
1..65 | ForEach-Object {
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST "$BASE/api/quotes" -H "Content-Type: application/json" --data $BODY
}
```

Expected:
- With Upstash configured: eventually `429`.
- Without Upstash configured: no `429`, confirming the finding.

### 23. Large JSON body pressure check

```powershell
$LARGE_NAME="A" * 200000
$BODY="{\"clientname\":\"$LARGE_NAME\"}"
curl.exe -i -X POST "$BASE/api/bookings" -H "Content-Type: application/json" --data $BODY
```

Expected:
- The route parses JSON first, then validation rejects. This verifies there is no pre-parse route-local size guard.

### 24. Security headers check

```powershell
curl.exe -I "$BASE/"
```

Expected:
- Present: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`.
- Missing: `Content-Security-Policy`.
