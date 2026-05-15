import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy & cookies",
  description: "Privacy policy and cookie information for Quick Man and Van.",
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Privacy &amp; cookies</h1>
      <p className="mt-4 text-zinc-600">
        How we collect, use, and protect your data — including analytics and marketing cookies — will be documented
        here before launch. Placeholder only.
      </p>
    </article>
  )
}
