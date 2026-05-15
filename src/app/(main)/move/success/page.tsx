import { ButtonLink } from "@/components/ui/Button"
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

  if (session_id) {
    const stripe = getStripe()
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id)
        paymentOk = session.payment_status === "paid"
      } catch {
        paymentOk = false
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl" aria-hidden>
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold text-zinc-900">Thank you</h1>
      <p className="mt-3 text-zinc-600">
        {paymentOk
          ? "Stripe reports a successful payment. You should receive a confirmation email shortly (after the webhook runs in production)."
          : session_id
            ? "We could not verify this session with Stripe from the server. If you completed payment, keep your Stripe receipt — confirmation email sends once the webhook is configured."
            : "Your booking flow finished. If you reached this page without paying, go back to the quote wizard."}
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/move" variant="outline">
          New quote
        </ButtonLink>
      </div>
      <p className="mt-8 text-sm text-zinc-500">
        Need help? <Link href="/contact" className="font-medium text-[#3fb6ee] hover:underline">Contact</Link>
      </p>
    </div>
  )
}
