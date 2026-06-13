import { DEPOSIT_PERCENT, DEPOSIT_RATE } from "@/lib/payment-config"
import { recomputeBookingPrice } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { checkoutBodySchema } from "@/lib/validators/quote"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const stripe = getStripe()
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"

  if (process.env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    throw new Error("NEXT_PUBLIC_BASE_URL must be set to the production domain before taking payments")
  }

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

  if (!booking.checkoutToken || booking.checkoutToken !== parsed.data.checkoutToken) {
    return NextResponse.json({ error: "booking_not_available" }, { status: 403 })
  }

  if (!booking.contactEmail) {
    return NextResponse.json({ error: "missing_contact_email" }, { status: 400 })
  }

  // Re-validate stored price against current pricing rules before charging
  if (booking.bookedHours != null && booking.bookedVanType != null) {
    const recomputed = await recomputeBookingPrice(booking)
    const priceDrift = Math.abs(recomputed - booking.price) / booking.price
    if (priceDrift > 0.01) {
      console.error("Price drift at checkout", { stored: booking.price, recomputed, bookingId: booking.id })
      return NextResponse.json(
        { error: "Price has changed, please re-request a quote" },
        { status: 409 },
      )
    }
  }

  const isDeposit = booking.paymentType === "DEPOSIT"
  const chargeAmount = isDeposit ? booking.price * DEPOSIT_RATE : booking.price
  const unitAmount = Math.round(chargeAmount * 100)
  if (unitAmount < 50) {
    return NextResponse.json({ error: "amount_too_small" }, { status: 400 })
  }

  try {
    if (booking.stripeSessionId) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(booking.stripeSessionId)
        if (existing.status === "open" && existing.url) {
          return NextResponse.json({ url: existing.url })
        }
      } catch (e) {
        console.error("Failed to retrieve existing Stripe session", { bookingId: booking.id, e })
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: booking.contactEmail,
        client_reference_id: booking.id,
        metadata: {
          bookingId: booking.id,
          paymentType: booking.paymentType,
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
                description: isDeposit
                ? `${DEPOSIT_PERCENT}% deposit — Booking ${booking.id.slice(0, 8)} — ${booking.collectionPostcode} → ${booking.deliveryPostcode}. Remaining balance due after the job.`
                : `Booking ${booking.id.slice(0, 8)} — ${booking.collectionPostcode} → ${booking.deliveryPostcode}`,
              },
            },
          },
        ],
        success_url: `${baseUrl}/move/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/move?cancelled=1`,
      },
      { idempotencyKey: booking.id },
    )

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
