import { CityLinks } from "@/components/home/CityLinks"
import { Hero } from "@/components/home/Hero"
import { HowItWorks } from "@/components/home/HowItWorks"
import { ReviewsSection } from "@/components/home/ReviewsSection"
import { ServicesSection } from "@/components/home/ServicesSection"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ReviewsSection />
      <ServicesSection />
      <CityLinks />
    </>
  )
}
