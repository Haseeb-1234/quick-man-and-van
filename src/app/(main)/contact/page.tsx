import { CONTACT, WHATSAPP_URL } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Quick Man and Van — phone, WhatsApp, and opening hours.",
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">Contact us</h1>
      <p className="mt-4 text-lg text-[#94A3B8]">
        We&apos;re here Mon–Sat. The contact form with spam protection will be added in Phase 3.
      </p>
      <dl className="surface-card mt-10 space-y-6 rounded-2xl p-6">
        <div>
          <dt className="text-sm font-medium text-[#94A3B8]">Hours</dt>
          <dd className="mt-1 text-[#F1F5F9]">{CONTACT.hoursLabel}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[#94A3B8]">Phone</dt>
          <dd className="mt-1">
            <a href={`tel:${CONTACT.phoneTel1}`} className="font-medium text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]">
              {CONTACT.phoneDisplay1}
            </a>
            <span className="mx-2 text-[#4B5563]">·</span>
            <a href={`tel:${CONTACT.phoneTel2}`} className="font-medium text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]">
              {CONTACT.phoneDisplay2}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-[#94A3B8]">WhatsApp</dt>
          <dd className="mt-1">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]">
              Message us on WhatsApp
            </a>
          </dd>
        </div>
      </dl>
    </div>
  )
}
