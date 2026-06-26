import { authOptions } from "@/lib/auth"
import { DEFAULT_CUSTOMER_BODY, DEFAULT_CUSTOMER_SUBJECT } from "@/lib/email-templates"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  customerSubject: z.string().min(1).max(200),
  customerBody: z.string().min(1).max(20000),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session != null
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const row = await prisma.emailSettings.findUnique({ where: { id: "singleton" } })
  return NextResponse.json(
    row ?? { customerSubject: DEFAULT_CUSTOMER_SUBJECT, customerBody: DEFAULT_CUSTOMER_BODY },
  )
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })

  const settings = await prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  })

  return NextResponse.json(settings)
}
