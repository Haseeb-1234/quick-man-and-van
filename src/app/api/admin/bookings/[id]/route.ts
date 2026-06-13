import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BookingStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session != null
}

const bookingStatusValues = Object.values(BookingStatus) as [BookingStatus, ...BookingStatus[]]

const updateSchema = z.object({
  status: z.enum(bookingStatusValues).optional(),
  contactName: z.string().max(120).optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().max(30).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await params
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 400 })

  const booking = await prisma.booking.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(booking)
}
