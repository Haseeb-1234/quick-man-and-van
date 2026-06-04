import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about man and van bookings with Quick Man and Van.",
}

export default function FaqPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">FAQ</h1>
      <p className="mt-4 text-[#94A3B8]">
        Common questions about pricing, what we move, coverage, and cancellations will be expanded here. For now,
        use <Link href="/contact" className="font-medium text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]">Contact</Link> or WhatsApp for
        specific questions.
      </p>
    </article>
  )
}
