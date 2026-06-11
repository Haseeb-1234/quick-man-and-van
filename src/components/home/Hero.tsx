import { ButtonLink } from "@/components/ui/Button"
import { QuickQuoteWidget } from "@/components/home/QuickQuoteWidget"

export function Hero() {
  return (
    <section className="hero-bg relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">UK-wide man &amp; van</p>
          <h1
            className="mt-3 font-display font-extrabold text-primary"
            style={{ fontSize: "clamp(42px, 6vw, 80px)", lineHeight: 1.05, letterSpacing: "-0.01em" }}
          >
            <span className="text-accent">Moving</span> made simple - quotes in minutes
          </h1>
          <p className="mt-4 max-w-[560px] text-lg leading-relaxed text-secondary">
            Tell us where you&apos;re moving from and to, pick your date, and see pricing options. Book online when
            you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/move" variant="primary" className="btn-primary px-8 py-[14px] text-base">
              Get free quotes
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="btn-secondary px-8 py-[14px] text-base">
              Speak to us
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-secondary">
            <li className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-accent/[12%] text-accent" aria-hidden>
                ✓
              </span>
              Up to 3 stop points
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-accent/[12%] text-accent" aria-hidden>
                ✓
              </span>
              Stairs &amp; access options
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-accent/[12%] text-accent" aria-hidden>
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
