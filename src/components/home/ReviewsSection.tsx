export function ReviewsSection() {
  return (
    <section className="border-t border-[rgba(255,255,255,0.07)] bg-[#1A2733] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">What customers say</h2>
        <p className="mt-3 text-lg text-[#94A3B8]">
          Reviews powered by{" "}
          <a
            href="https://www.reviews.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]"
          >
            Reviews.io
          </a>{" "}
          will appear here on the live site.
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-[rgba(255,255,255,0.06)] bg-[#0F1923] p-12 text-center">
          <p className="text-sm font-medium text-[#F1F5F9]">Reviews widget placeholder</p>
          <p className="mt-2 text-sm italic text-[#94A3B8]">
            Phase 4: embed the Reviews.io API / widget on this section of the homepage.
          </p>
        </div>
      </div>
    </section>
  )
}
