import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  companyName: z.string().min(1).max(100),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  smallVanRate: z.number().min(1),
  mediumVanRate: z.number().min(1),
  largeVanRate: z.number().min(1),
  lutonVanRate: z.number().min(1),
  helper2Rate: z.number().min(0),
  helper3Rate: z.number().min(0),
  stairRate: z.number().min(0),
  stopRate: z.number().min(0),
  minHours: z.number().min(1).max(24),
  maxHours: z.number().min(1).max(24),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session != null
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const row = await prisma.pricingSettings.findUnique({ where: { id: "singleton" } })
  return NextResponse.json(row)
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })

  const settings = await prisma.pricingSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  })

  return NextResponse.json(settings)
}
