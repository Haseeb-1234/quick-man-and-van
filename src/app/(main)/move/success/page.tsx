import { ButtonLink } from "@/components/ui/Button"
import { DEPOSIT_PERCENT, REMAINDER_RATE } from "@/lib/payment-config"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Booking confirmed",
  description: "Your man and van payment was successful.",
}

type Props = { searchParams: Promise<{ session_id?: string }> }

export default async function MoveSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams
  let paymentOk = false
  let isDeposit = false
  let remainingAmount: string | null = null

  if (session_id) {
    const stripe = getStripe()
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id)
        paymentOk = session.payment_status === "paid"
        const bookingId = session.metadata?.bookingId ?? session.client_reference_id
        if (bookingId) {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { paymentType: true, price: true },
          })
          isDeposit = booking?.paymentType === "DEPOSIT"
          if (isDeposit && booking?.price) {
            remainingAmount = (booking.price * REMAINDER_RATE).toFixed(2)
          }
        }
      } catch {
        paymentOk = false
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/12 text-2xl text-accent" aria-hidden>
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold text-primary">Thank you</h1>
      <p className="mt-3 text-secondary">
        {paymentOk
          ? isDeposit
            ? `${DEPOSIT_PERCENT}% deposit received. You should receive a confirmation email shortly.`
            : "Payment confirmed. You should receive a confirmation email shortly."
          : session_id
            ? "We could not verify this session with Stripe. If you completed payment, keep your Stripe receipt — confirmation email sends once the webhook is configured."
            : "Your booking flow finished. If you reached this page without paying, go back to the quote wizard."}
      </p>
      {paymentOk && isDeposit && remainingAmount ? (
        <p className="mt-3 rounded border border-accent/30 bg-accent/8 px-4 py-3 text-sm text-secondary">
          The remaining <strong className="text-primary">£{remainingAmount}</strong> is due to the driver by cash or bank transfer after the job is complete.
        </p>
      ) : null}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/move" variant="outline">
          New quote
        </ButtonLink>
      </div>
      <p className="mt-8 text-sm text-secondary">
        Need help? <Link href="/contact" className="font-medium text-accent transition duration-150 hover:opacity-80">Contact</Link>
      </p>
    </div>
  )
}
