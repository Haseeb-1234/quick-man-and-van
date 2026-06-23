import Link from "next/link"
import { CONTACT, SERVICE_CITIES, SITE_NAME, WHATSAPP_URL } from "@/lib/site"

const guideLinks = [
  { href: "/s/moving-tips", label: "Moving tips" },
  { href: "/s/bestprices", label: "Best prices" },
  { href: "/s/sizeguide", label: "Size guide" },
  { href: "/s/faq", label: "FAQ" },
] as const

const legalLinks = [
  { href: "/s/termsofuse", label: "Terms of use" },
  { href: "/s/privacy-cookies", label: "Privacy & cookies" },
] as const

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-footer-bg">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-semibold text-primary">{SITE_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              Laxami Man and Van — moves across the UK. Instant quotes and simple booking, no driver app required on your side.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-primary">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-secondary">
              <li>{CONTACT.hoursLabel}</li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="text-accent transition duration-150 hover:text-accent-hover">
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-accent transition duration-150 hover:text-accent-hover">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-primary">Areas</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              {SERVICE_CITIES.map(({ slug, name }) => (
                <li key={slug}>
                  <Link href={`/man-and-van/${slug}`} className="text-secondary transition duration-150 hover:text-accent">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-primary">Guides & legal</p>
            <ul className="mt-3 space-y-1 text-sm">
              {guideLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-secondary transition duration-150 hover:text-accent">
                    {label}
                  </Link>
                </li>
              ))}
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-secondary transition duration-150 hover:text-accent">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-[var(--border)] pt-8 text-center text-[13px] text-muted" suppressHydrationWarning>
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
