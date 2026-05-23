import { SERVICE_CITIES, SITE_NAME, isCitySlug } from "@/lib/site"
import { ButtonLink } from "@/components/ui/Button"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ city: string }> }

export function generateStaticParams() {
  return SERVICE_CITIES.map(({ slug }) => ({ city: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  if (!isCitySlug(city)) {
    return { title: "Area" }
  }
  const name = SERVICE_CITIES.find((c) => c.slug === city)!.name
  return {
    title: `Man and van ${name}`,
    description: `Book a man and van in ${name} — instant quotes, UK-wide service from ${SITE_NAME}.`,
    openGraph: {
      title: `Man and van ${name} | ${SITE_NAME}`,
      description: `Reliable man and van moves in ${name}.`,
    },
  }
}

export default async function CityPage({ params }: Props) {
  const { city } = await params
  if (!isCitySlug(city)) {
    notFound()
  }
  const name = SERVICE_CITIES.find((c) => c.slug === city)!.name

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#F59E0B]">Local service</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#F1F5F9]">Man and van in {name}</h1>
      <p className="mt-4 text-lg leading-relaxed text-[#94A3B8]">
        Whether you&apos;re moving flat, shifting furniture, or need a delivery across {name}, you can get an
        instant quote online and book when it suits you. This page will gain richer SEO copy, FAQs, and internal
        links in Phase 3.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/move">Get free quotes</ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Contact
        </ButtonLink>
      </div>
    </div>
  )
}
