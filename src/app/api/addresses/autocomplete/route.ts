import { activeGeoProvider, autocompleteAddress } from "@/lib/geo-services"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const term = (searchParams.get("term") ?? "").trim()
  if (term.length < 3 || term.length > 120) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const suggestions = await autocompleteAddress(term)
    return NextResponse.json({ suggestions, provider: activeGeoProvider() })
  } catch {
    return NextResponse.json({ suggestions: [], error: "lookup_failed" }, { status: 502 })
  }
}
