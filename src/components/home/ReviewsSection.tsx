const reviews = [
  {
    name: "Ahmed K.",
    location: "London",
    body: "Booked for a house move from Hackney to Leicester. The van arrived on time, the driver was brilliant — careful with everything and very professional. The online quote took less than two minutes. Would use again without hesitation.",
    stars: 5,
  },
  {
    name: "Sarah M.",
    location: "Manchester",
    body: "Helped me move out of my student flat. I was worried about my big wardrobe but the driver brought a helper and they had it sorted in no time. Price was exactly what was quoted, no surprises. Really happy.",
    stars: 5,
  },
  {
    name: "David T.",
    location: "Birmingham",
    body: "Needed a large sofa collected from a seller and delivered to my flat on the third floor. The team were friendly and got it done without any damage. Great value for money compared to other quotes I had.",
    stars: 5,
  },
  {
    name: "Emma L.",
    location: "Leeds",
    body: "Used Laxami for a small office relocation. Very efficient — everything was packed into the van quickly and nothing was damaged. The booking system is easy to use and I got a confirmation email straight away.",
    stars: 5,
  },
  {
    name: "James P.",
    location: "Southampton",
    body: "Two-bed house move within the city. Driver was punctual and worked hard the whole time. Stairs were a bit tricky but they handled it no problem. Competitive price and a stress-free experience overall.",
    stars: 5,
  },
  {
    name: "Priya N.",
    location: "Leicester",
    body: "Moved a piano — something most companies won't touch. The team came prepared with the right equipment and delivered it without a scratch. Friendly, reliable and worth every penny.",
    stars: 5,
  },
] as const

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          className={i < count ? "text-accent" : "text-[var(--border)]"}
          aria-hidden
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export function ReviewsSection() {
  return (
    <section className="border-t border-[var(--border)] bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary">What customers say</h2>
          <p className="mt-3 text-lg text-secondary">Real feedback from people we&apos;ve helped move across the UK.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="surface-card flex flex-col gap-4 rounded-2xl p-6"
            >
              <Stars count={review.stars} />
              <p className="flex-1 text-sm leading-relaxed text-secondary">&ldquo;{review.body}&rdquo;</p>
              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-sm font-semibold text-primary">{review.name}</p>
                <p className="text-xs text-muted">{review.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
