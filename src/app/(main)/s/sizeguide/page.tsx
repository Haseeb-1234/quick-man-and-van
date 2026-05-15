import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Size guide",
  description: "Choose the right van size for your move — small, medium, large, or Luton.",
}

export default function SizeGuidePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Van size guide</h1>
      <p className="mt-4 text-lg text-zinc-600">
        Small vans suit few boxes and small furniture; Luton vans fit most flat or small-house moves. A visual
        comparison table will be added in Phase 3 alongside the quote wizard.
      </p>
    </article>
  )
}
