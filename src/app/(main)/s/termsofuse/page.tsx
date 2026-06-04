import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms of use for the Man and Van website and booking service.",
}

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">Terms of use</h1>
      <p className="mt-4 text-[#94A3B8]">
        Full legal terms for using this site and making bookings will be published here. This is a placeholder
        during development.
      </p>
    </article>
  )
}
