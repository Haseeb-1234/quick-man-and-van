const steps = [
  {
    step: "1",
    title: "Enter your route",
    body: "Collection and delivery addresses, plus up to three stops. Add stairs per address so we price fairly.",
  },
  {
    step: "2",
    title: "Pick date & van",
    body: "Choose when you need the van and how many helpers you want. We show clear options side by side.",
  },
  {
    step: "3",
    title: "Book & pay",
    body: "Confirm your move and pay securely by card. You’ll get a confirmation email with your booking details.",
  },
] as const

export function HowItWorks() {
  return (
    <section className="border-t border-[rgba(255,255,255,0.07)] bg-[#1A2733] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">How it works</h2>
          <p className="mt-3 text-lg text-[#94A3B8]">Three simple steps from quote to confirmed booking.</p>
        </div>
        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map(({ step, title, body }) => (
            <li key={step} className="surface-card relative overflow-hidden rounded-2xl p-6">
              <span className="absolute right-5 top-2 font-display text-5xl font-bold text-[rgba(245,158,11,0.15)]" aria-hidden>
                {step}
              </span>
              <span className="relative flex size-10 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)] text-sm font-bold text-[#F59E0B]">
                {step}
              </span>
              <h3 className="relative mt-4 text-lg font-semibold text-[#F1F5F9]">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-[#94A3B8]">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
