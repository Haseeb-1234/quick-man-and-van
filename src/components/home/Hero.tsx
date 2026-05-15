import { ButtonLink } from "@/components/ui/Button"
import { QuickQuoteWidget } from "@/components/home/QuickQuoteWidget"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#3fb6ee]/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#3fb6ee]">UK-wide man &amp; van</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-[2.75rem] xl:text-5xl">
            Moving made simple — quotes in minutes
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600">
            Tell us where you&apos;re moving from and to, pick your date, and see pricing options. Book online when
            you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/move" variant="primary" className="px-6 py-3 text-base">
              Get free quotes
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="px-6 py-3 text-base">
              Speak to us
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden>
                ✓
              </span>
              Up to 3 stop points
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden>
                ✓
              </span>
              Stairs &amp; access options
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden>
                ✓
              </span>
              Secure card payment
            </li>
          </ul>
        </div>
        <div className="mt-12 lg:mt-0">
          <QuickQuoteWidget />
        </div>
      </div>
    </section>
  )
}
