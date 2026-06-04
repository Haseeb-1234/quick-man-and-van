import { rejectOversizedJsonRequest } from "@/lib/api-security"
import { prisma } from "@/lib/prisma"
import { computeQuotes, parseMoveDateTime, vanLabels } from "@/lib/pricing"
import { COORDS_REQUIRED_MESSAGE, createBookingSchema, hasCoordsValidationError } from "@/lib/validators/quote"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const sizeError = rejectOversizedJsonRequest(req)
  if (sizeError) return sizeError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    if (hasCoordsValidationError(parsed.error)) {
      return NextResponse.json({ error: COORDS_REQUIRED_MESSAGE }, { status: 400 })
    }
    return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const { minHours } = await computeQuotes(data)
  const enforcedHours = Math.max(data.hours, minHours)
  const bookingInput = { ...data, hours: enforcedHours }
  const { quotes } = await computeQuotes(bookingInput)
  const selectedQuote = data.selectedQuoteId ? quotes.find((q) => q.id === data.selectedQuoteId) : null
  const bestQuote = selectedQuote ?? quotes[0]
  const moveDate = parseMoveDateTime(data.date, data.time)

  try {
    const duplicateSince = new Date(Date.now() - 10 * 60 * 1000)
    const existing = await prisma.booking.findFirst({
      where: {
        status: "PENDING",
        contactEmail: data.clientemail,
        contactPhone: data.clientphone,
        collectionAddress: data.collection.addr,
        deliveryAddress: data.delivery.addr,
        moveDate,
        createdAt: { gte: duplicateSince },
      },
      orderBy: { createdAt: "desc" },
    })

    if (existing?.checkoutToken) {
      return NextResponse.json({
        bookingId: existing.id,
        checkoutToken: existing.checkoutToken,
        price: existing.price,
      })
    }

    const checkoutToken = randomUUID()

    const booking = await prisma.booking.create({
      data: {
        collectionAddress: data.collection.addr,
        collectionPostcode: data.collection.postcode,
        collectionStairs: data.collection.stairs,
        deliveryAddress: data.delivery.addr,
        deliveryPostcode: data.delivery.postcode,
        deliveryStairs: data.delivery.stairs,
        stops: data.stops,
        moveDate,
        vanSize: vanLabels[data.vantype],
        helpers: data.helpers,
        price: bestQuote?.price ?? 0,
        bookedHours: enforcedHours,
        bookedVanType: data.vantype,
        contactEmail: data.clientemail,
        contactName: data.clientname?.trim() || null,
        contactPhone: data.clientphone?.trim() || null,
        checkoutToken,
        status: "PENDING",
      },
    })

    return NextResponse.json({
      bookingId: booking.id,
      checkoutToken: booking.checkoutToken,
      price: booking.price,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "create_failed" }, { status: 500 })
  }
}

