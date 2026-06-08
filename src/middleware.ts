import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

function getAllowedOrigins(request: NextRequest): Set<string> {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const proto = forwardedProto || request.nextUrl.protocol.replace(":", "")
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const requestOrigin = host ? `${proto}://${host}` : null

  return new Set(
    [
      request.nextUrl.origin,
      requestOrigin,
      process.env.NEXT_PUBLIC_BASE_URL,
      process.env.NEXTAUTH_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3002",
    ].filter((origin): origin is string => Boolean(origin)),
  )
}

function handleCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin")
  const allowedOrigins = getAllowedOrigins(request)

  if (origin && !allowedOrigins.has(origin)) {
    // Reject cross-origin requests to /api/* from unlisted origins
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 })
    }
  }

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type")
    response.headers.set("Vary", "Origin")
  }

  return response
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

// Rate limits per route prefix (requests per 60-second window)
const LIMITS: { prefix: string; max: number }[] = [
  { prefix: "/api/bookings", max: 10 },
  { prefix: "/api/stripe/checkout", max: 10 },
  { prefix: "/api/addresses/autocomplete", max: 30 },
  { prefix: "/api/quotes", max: 60 },
]

const ratelimiterByMax = new Map<number, Ratelimit>()
let sharedRedis: Redis | null = null

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  sharedRedis ??= new Redis({ url, token })
  return sharedRedis
}

function getRatelimiter(max: number): Ratelimit | null {
  const cached = ratelimiterByMax.get(max)
  if (cached) return cached

  const redis = getRedis()
  if (!redis) return null

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, "60 s"),
    prefix: "rl",
  })
  ratelimiterByMax.set(max, limiter)
  return limiter
}

// ---------------------------------------------------------------------------
// Middleware entry point
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin/* — redirect to login if no valid session
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Handle CORS preflight before any other logic
  if (request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 })
    return handleCors(request, preflight)
  }

  // Apply CORS headers / origin enforcement for all API routes
  if (pathname.startsWith("/api/")) {
    const corsCheck = handleCors(request, NextResponse.next())
    if (corsCheck.status === 403) return corsCheck
  }

  // Rate limiting (only on the specific routes listed)
  const rule = LIMITS.find((r) => pathname.startsWith(r.prefix))
  if (!rule) return NextResponse.next()

  const limiter = getRatelimiter(rule.max)
  if (!limiter) {
    // Redis not configured: keep the customer funnel available.
    return NextResponse.next()
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"

  const { success } = await limiter.limit(`${rule.prefix}:${ip}`)

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
}

