import Link from "next/link"
import { SERVICE_CITIES } from "@/lib/site"

export function CityLinks() {
  return (
    <section className="border-t border-zinc-200 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Man and van near you</h2>
        <p className="mt-3 max-w-2xl text-lg text-zinc-600">
          Local landing pages with area-focused information — more cities will be added over time.
        </p>
        <ul className="mt-10 flex flex-wrap gap-3">
          {SERVICE_CITIES.map(({ slug, name }) => (
            <li key={slug}>
              <Link
                href={`/man-and-van/${slug}`}
                className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-[#3fb6ee] hover:bg-sky-50 hover:text-zinc-900"
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
