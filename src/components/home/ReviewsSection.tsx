export function ReviewsSection() {
  return (
    <section className="border-t border-[var(--border)] bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-primary">What customers say</h2>
        <p className="mt-3 text-lg text-secondary">
          Reviews powered by{" "}
          <a
            href="https://www.reviews.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent transition duration-150 hover:text-accent-hover"
          >
            Reviews.io
          </a>{" "}
          will appear here on the live site.
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-[var(--border)] bg-page p-12 text-center">
          <p className="text-sm font-medium text-primary">Reviews widget placeholder</p>
          <p className="mt-2 text-sm italic text-secondary">
            Phase 4: embed the Reviews.io API / widget on this section of the homepage.
          </p>
        </div>
      </div>
    </section>
  )
}
