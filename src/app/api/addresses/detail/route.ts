import { decodeAddress } from "@/lib/geo-services"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 })
  }

  const resolved = decodeAddress(id)
  if (!resolved) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
  return NextResponse.json(resolved)
}
