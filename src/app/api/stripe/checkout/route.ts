import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { checkoutBodySchema } from "@/lib/validators/quote"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const stripe = getStripe()
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = checkoutBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
  })

  if (!booking || booking.status !== "PENDING") {
    return NextResponse.json({ error: "booking_not_available" }, { status: 400 })
  }

  if (!booking.contactEmail) {
    return NextResponse.json({ error: "missing_contact_email" }, { status: 400 })
  }

  const unitAmount = Math.round(booking.price * 100)
  if (unitAmount < 50) {
    return NextResponse.json({ error: "amount_too_small" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.contactEmail,
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
      },
      payment_intent_data: {
        metadata: { bookingId: booking.id },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: unitAmount,
            product_data: {
              name: "Man and van move",
              description: `Booking ${booking.id.slice(0, 8)} — ${booking.collectionPostcode} → ${booking.deliveryPostcode}`,
            },
          },
        },
      ],
      success_url: `${baseUrl}/move/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/move?cancelled=1`,
    })

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    })

    if (!session.url) {
      return NextResponse.json({ error: "no_checkout_url" }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "checkout_create_failed" }, { status: 500 })
  }
}
