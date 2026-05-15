import { CONTACT, WHATSAPP_URL } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Quick Man and Van — phone, WhatsApp, and opening hours.",
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Contact us</h1>
      <p className="mt-4 text-lg text-zinc-600">
        We&apos;re here Mon–Sat. The contact form with spam protection will be added in Phase 3.
      </p>
      <dl className="mt-10 space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <div>
          <dt className="text-sm font-medium text-zinc-500">Hours</dt>
          <dd className="mt-1 text-zinc-900">{CONTACT.hoursLabel}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-zinc-500">Phone</dt>
          <dd className="mt-1">
            <a href={`tel:${CONTACT.phoneTel1}`} className="font-medium text-[#3fb6ee] hover:underline">
              {CONTACT.phoneDisplay1}
            </a>
            <span className="mx-2 text-zinc-400">·</span>
            <a href={`tel:${CONTACT.phoneTel2}`} className="font-medium text-[#3fb6ee] hover:underline">
              {CONTACT.phoneDisplay2}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-zinc-500">WhatsApp</dt>
          <dd className="mt-1">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[#3fb6ee] hover:underline">
              Message us on WhatsApp
            </a>
          </dd>
        </div>
      </dl>
    </div>
  )
}
