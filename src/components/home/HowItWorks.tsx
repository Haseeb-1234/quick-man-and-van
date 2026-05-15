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
    <section className="border-t border-zinc-200 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">How it works</h2>
          <p className="mt-3 text-lg text-zinc-600">Three simple steps from quote to confirmed booking.</p>
        </div>
        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map(({ step, title, body }) => (
            <li key={step} className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3fb6ee] text-sm font-bold text-white">
                {step}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
