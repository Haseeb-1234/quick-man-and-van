import { NextResponse } from "next/server"

// Temporary diagnostic: reveals ONLY whether the server has a live or test
// Stripe key — no key characters are exposed. Remove once issue is resolved.
export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? ""
  const mode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "not_configured"
  return NextResponse.json({ mode, keyLength: key.length })
}
