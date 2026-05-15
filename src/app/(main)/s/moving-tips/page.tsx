import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Moving tips",
  description: "Practical tips to prepare for your man and van move in the UK.",
}

export default function MovingTipsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Moving tips</h1>
      <p className="mt-4 text-lg text-zinc-600">
        Label boxes by room, disassemble large furniture where possible, and keep parking/access clear for the van.
        A fuller guide will be published here in Phase 3.
      </p>
    </article>
  )
}
