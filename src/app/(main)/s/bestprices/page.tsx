import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Best prices",
  description: "How Laxami Man and Van keeps pricing fair and transparent for UK moves.",
}

export default function BestPricesPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">Best prices</h1>
      <p className="mt-4 text-lg text-[#94A3B8]">
        Quotes reflect route, van size, helpers, stairs, and timing — you see options before you pay. Detailed
        pricing content will be added in Phase 3.
      </p>
    </article>
  )
}
