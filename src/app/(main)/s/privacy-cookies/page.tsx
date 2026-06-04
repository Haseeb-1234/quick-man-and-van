import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy & cookies",
  description: "Privacy policy and cookie information for Man and Van.",
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">Privacy &amp; cookies</h1>
      <p className="mt-4 text-[#94A3B8]">
        How we collect, use, and protect your data — including analytics and marketing cookies — will be documented
        here before launch. Placeholder only.
      </p>
    </article>
  )
}
