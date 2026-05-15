export function ReviewsSection() {
  return (
    <section className="border-t border-zinc-200 bg-gradient-to-b from-white to-sky-50/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">What customers say</h2>
        <p className="mt-3 text-lg text-zinc-600">
          Reviews powered by{" "}
          <a
            href="https://www.reviews.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#3fb6ee] hover:underline"
          >
            Reviews.io
          </a>{" "}
          will appear here on the live site.
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-12 text-center">
          <p className="text-sm font-medium text-zinc-500">Reviews widget placeholder</p>
          <p className="mt-2 text-sm text-zinc-600">
            Phase 4: embed the Reviews.io API / widget on this section of the homepage.
          </p>
        </div>
      </div>
    </section>
  )
}
