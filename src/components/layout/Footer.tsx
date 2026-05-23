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
    <footer className="border-t border-[rgba(255,255,255,0.07)] bg-[#080F16]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-semibold text-[#F1F5F9]">{SITE_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
              Man and van moves across the UK. Instant quotes and simple booking — no driver app required on your side.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F5F9]">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-[#94A3B8]">
              <li>{CONTACT.hoursLabel}</li>
              <li>
                <a href={`tel:${CONTACT.phoneTel1}`} className="text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]">
                  {CONTACT.phoneDisplay1}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phoneTel2}`} className="text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]">
                  {CONTACT.phoneDisplay2}
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F5F9]">Areas</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              {SERVICE_CITIES.map(({ slug, name }) => (
                <li key={slug}>
                  <Link href={`/man-and-van/${slug}`} className="text-[#94A3B8] transition duration-150 hover:text-[#F59E0B]">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#F1F5F9]">Guides & legal</p>
            <ul className="mt-3 space-y-1 text-sm">
              {guideLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[#94A3B8] transition duration-150 hover:text-[#F59E0B]">
                    {label}
                  </Link>
                </li>
              ))}
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[#94A3B8] transition duration-150 hover:text-[#F59E0B]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-[rgba(255,255,255,0.07)] pt-8 text-center text-[13px] text-[#4B5563]">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
