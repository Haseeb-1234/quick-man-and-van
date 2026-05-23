import Link from "next/link"
import { SERVICE_CITIES } from "@/lib/site"

export function CityLinks() {
  return (
    <section className="border-t border-[rgba(255,255,255,0.07)] bg-[#0F1923] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">Man and van near you</h2>
        <p className="mt-3 max-w-2xl text-lg text-[#94A3B8]">
          Local landing pages with area-focused information — more cities will be added over time.
        </p>
        <ul className="mt-10 flex flex-wrap gap-3">
          {SERVICE_CITIES.map(({ slug, name }) => (
            <li key={slug}>
              <Link
                href={`/man-and-van/${slug}`}
                className="inline-flex rounded-full border border-[rgba(255,255,255,0.07)] bg-[#1A2733] px-4 py-2 text-sm font-medium text-[#94A3B8] transition duration-150 hover:border-[rgba(245,158,11,0.4)] hover:bg-[#223040] hover:text-[#F59E0B]"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
