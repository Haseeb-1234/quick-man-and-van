import { ContactForm } from "./ContactForm"
import { CONTACT, WHATSAPP_URL } from "@/lib/site"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Laxami Man and Van — phone, WhatsApp, email, or send us a message.",
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-4xl font-bold tracking-tight text-primary">Contact us</h1>
      <p className="mt-3 text-lg text-secondary">
        Got a question or need help with your move? Send us a message and we&apos;ll get back to you.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">

        <ContactForm />

        <div className="space-y-6">
          <div className="surface-card rounded-2xl p-6 space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-secondary">Hours</p>
              <p className="mt-1 font-medium text-primary">{CONTACT.hoursLabel}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-secondary">Email</p>
              <a href={`mailto:${CONTACT.email}`} className="mt-1 block font-medium text-accent hover:text-accent-hover transition duration-150">
                {CONTACT.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-secondary">WhatsApp</p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-1 block font-medium text-accent hover:text-accent-hover transition duration-150">
                Message us on WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-xl bg-accent/8 p-5">
            <p className="text-sm font-semibold text-primary">Need an instant quote?</p>
            <p className="mt-1 text-sm text-secondary">Get a price in under a minute — no account needed.</p>
            <Link href="/move" className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition duration-150">
              Get free quotes
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
