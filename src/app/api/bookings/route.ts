import { prisma } from "@/lib/prisma"
import { computeQuotes, parseMoveDateTime, vanLabels } from "@/lib/pricing"
import { createBookingSchema } from "@/lib/validators/quote"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const { quotes } = await computeQuotes(data)
  const bestQuote = quotes[0]

  try {
    const booking = await prisma.booking.create({
      data: {
        collectionAddress: data.collection.addr,
        collectionPostcode: data.collection.postcode,
        collectionStairs: data.collection.stairs,
        deliveryAddress: data.delivery.addr,
        deliveryPostcode: data.delivery.postcode,
        deliveryStairs: data.delivery.stairs,
        stops: data.stops,
        moveDate: parseMoveDateTime(data.date, data.time),
        vanSize: vanLabels[data.vantype],
        helpers: data.helpers,
        price: bestQuote?.price ?? 0,
        contactEmail: data.clientemail,
        contactName: data.clientname?.trim() || null,
        contactPhone: data.clientphone?.trim() || null,
        status: "PENDING",
      },
    })

    return NextResponse.json({
      bookingId: booking.id,
      price: booking.price,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "create_failed" }, { status: 500 })
  }
}
