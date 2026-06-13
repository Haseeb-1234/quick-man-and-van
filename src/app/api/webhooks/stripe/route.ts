import { sendBookingConfirmationEmail } from "@/lib/booking-email"
import { DEPOSIT_RATE } from "@/lib/payment-config"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(req: Request) {
  const stripe = getStripe()
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !whSecret) {
    return new NextResponse("Webhook not configured", { status: 503 })
  }

  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return new NextResponse("Missing stripe-signature", { status: 400 })
  }

  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret)
  } catch {
    return new NextResponse("Invalid signature", { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const bookingId = session.metadata?.bookingId ?? session.client_reference_id
    if (!bookingId) {
      return NextResponse.json({ received: true, skipped: "no_booking_id" })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return NextResponse.json({ received: true, skipped: "booking_missing" })
    }

    const paidGbp = (session.amount_total ?? 0) / 100
    const expectedGbp = booking.paymentType === "DEPOSIT" ? booking.price * DEPOSIT_RATE : booking.price
    if (Math.abs(paidGbp - expectedGbp) > 0.02) {
      console.error("Amount mismatch", {
        bookingId,
        paidGbp,
        expectedGbp,
        storedPrice: booking.price,
        paymentType: booking.paymentType,
      })
      return NextResponse.json({ error: "amount mismatch" }, { status: 500 })
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null

    const result = await prisma.booking.updateMany({
      where: { id: bookingId, status: "PENDING" },
      data: {
        status: "CONFIRMED",
        stripePaymentId: paymentIntentId,
        stripeSessionId: session.id,
      },
    })

    if (result.count === 0) {
      console.warn("Webhook checkout.session.completed: booking already processed or not pending", {
        bookingId,
      })
      return NextResponse.json({ received: true, idempotent: true })
    }

    const confirmed = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (confirmed) {
      await sendBookingConfirmationEmail(confirmed)
    }
  }

  return NextResponse.json({ received: true })
}
