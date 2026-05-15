import { computeQuotes } from "@/lib/pricing"
import { quoteRequestSchema } from "@/lib/validators/quote"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = quoteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await computeQuotes(parsed.data)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "quote_failed" }, { status: 500 })
  }
}
