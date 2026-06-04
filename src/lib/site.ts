export const SITE_NAME = "Man and Van"

export const SITE_DESCRIPTION =
  "UK man and van bookings — instant quotes, trusted movers, nationwide coverage."

export const BRAND_PRIMARY = "#3fb6ee"

export const WHATSAPP_URL = "https://wa.me/447479976677"

export const CONTACT = {
  hoursLabel: "Mon–Sat 08:00–19:00",
  phoneDisplay1: "+44 7479 976 677",
  phoneTel1: "+447479976677",
  phoneDisplay2: "+44 199 267 7586",
  phoneTel2: "+441992677586",
} as const

export const SERVICE_CITIES = [
  { slug: "london", name: "London" },
  { slug: "leeds", name: "Leeds" },
  { slug: "manchester", name: "Manchester" },
  { slug: "birmingham", name: "Birmingham" },
  { slug: "leicester", name: "Leicester" },
  { slug: "southampton", name: "Southampton" },
] as const

export type CitySlug = (typeof SERVICE_CITIES)[number]["slug"]

export function isCitySlug(s: string): s is CitySlug {
  return SERVICE_CITIES.some((c) => c.slug === s)
}
