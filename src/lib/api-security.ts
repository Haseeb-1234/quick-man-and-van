import { NextResponse } from "next/server"

const DEFAULT_MAX_JSON_BYTES = 32 * 1024

export function rejectOversizedJsonRequest(req: Request, maxBytes = DEFAULT_MAX_JSON_BYTES): NextResponse | null {
  const rawLength = req.headers.get("content-length")
  if (!rawLength) return null

  const length = Number(rawLength)
  if (!Number.isFinite(length) || length < 0) {
    return NextResponse.json({ error: "invalid_content_length" }, { status: 400 })
  }

  if (length > maxBytes) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 })
  }

  return null
}
