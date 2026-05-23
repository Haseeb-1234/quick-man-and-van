import { addressLegSchema } from "@/lib/validators/quote"
import type { AddressLeg, JourneySummary } from "@/types/quote"

const PHOTON_BASE = "https://photon.komoot.io/api/"
// TODO: Replace with self-hosted OSRM before production traffic
const OSRM_BASE = "https://router.project-osrm.org"
const GOOGLE_BASE = "https://maps.googleapis.com/maps/api"

type GeoProvider = "free" | "google"

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    housenumber?: string
    street?: string
    city?: string
    town?: string
    village?: string
    postcode?: string
    country?: string
    countrycode?: string
  }
}

type PhotonResponse = {
  features?: PhotonFeature[]
}

type OsrmResponse = {
  code?: string
  routes?: { duration?: number; distance?: number }[]
}

type GoogleAutocompleteResponse = {
  predictions?: { description: string; place_id: string; structured_formatting?: { main_text?: string; secondary_text?: string } }[]
}

type GoogleDetailsResponse = {
  result?: {
    formatted_address?: string
    address_components?: { long_name: string; types: string[] }[]
    geometry?: { location?: { lat: number; lng: number } }
  }
}

type GoogleAddressComponent = { long_name: string; types: string[] }

type GoogleDistanceResponse = {
  rows?: { elements?: { status: string; distance?: { value: number }; duration?: { value: number } }[] }[]
}

export type AddressSuggestion = {
  id: string
  address: string
  mainText: string
  secondaryText: string
  detail: AddressLeg
}

function geoProvider(): GeoProvider {
  return process.env.GEO_PROVIDER === "google" ? "google" : "free"
}

export function activeGeoProvider(): "google" | "photon" {
  return geoProvider() === "google" ? "google" : "photon"
}

function googleKey(): string {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!key) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is required")
  return key
}

function encodeAddress(leg: AddressLeg): string {
  return Buffer.from(JSON.stringify(leg), "utf8").toString("base64url")
}

function component(components: GoogleAddressComponent[] | undefined, type: string): string {
  if (!Array.isArray(components)) return ""
  return components.find((c) => c.types.includes(type))?.long_name ?? ""
}

export function decodeAddress(id: string): AddressLeg | null {
  try {
    const raw: unknown = JSON.parse(Buffer.from(id, "base64url").toString("utf8"))
    const result = addressLegSchema.safeParse(raw)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function formatLabel(parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part, index, arr) => arr.indexOf(part) === index)
    .join(", ")
}

function looksLikeUkPostcode(value: string | undefined): boolean {
  return Boolean(value?.trim().match(/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i))
}

function mapPhotonFeature(feature: PhotonFeature): AddressSuggestion | null {
  const props = feature.properties ?? {}
  const coords = feature.geometry?.coordinates
  if (!coords || coords.length < 2) return null

  const lon = coords[0]
  const lat = coords[1]
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const city = props.city || props.town || props.village || ""
  const postcode = props.postcode || (looksLikeUkPostcode(props.name) ? props.name?.toUpperCase().replace(/\s+/, " ") : "") || ""
  const nameIsPostcode = looksLikeUkPostcode(props.name)
  const streetName = props.street || (nameIsPostcode ? "" : props.name) || ""
  const street = [props.housenumber, streetName].filter(Boolean).join(" ").trim()
  const address = formatLabel([nameIsPostcode ? undefined : props.name, props.street, city, postcode]) || formatLabel([street, city, postcode])

  if (!address) return null

  const detail: AddressLeg = {
    addr: address,
    street,
    city,
    postcode,
    lat,
    long: lon,
    stairs: 0,
  }

  return {
    id: encodeAddress(detail),
    address,
    mainText: props.name || street || address,
    secondaryText: formatLabel([props.street, city, props.postcode]),
    detail,
  }
}

export async function autocompleteAddress(input: string): Promise<AddressSuggestion[]> {
  if (geoProvider() === "google") return autocompleteAddressGoogle(input)
  return autocompleteAddressFree(input)
}

async function autocompleteAddressFree(input: string): Promise<AddressSuggestion[]> {
  const trimmed = input.trim()
  if (trimmed.length < 3) return []

  const params = new URLSearchParams({
    q: trimmed,
    limit: "7",
    lang: "en",
    countrycode: "gb",
  })

  // TODO: Replace with production geocoding API before going live
  const res = await fetch(`${PHOTON_BASE}?${params}`, { cache: "no-store" })
  if (!res.ok) throw new Error("photon_autocomplete_failed")

  const data = (await res.json()) as PhotonResponse
  return (data.features ?? []).map(mapPhotonFeature).filter((item): item is AddressSuggestion => Boolean(item))
}

async function autocompleteAddressGoogle(input: string): Promise<AddressSuggestion[]> {
  const trimmed = input.trim()
  if (trimmed.length < 3) return []

  const params = new URLSearchParams({
    input: trimmed,
    components: "country:gb",
    types: "address",
    key: googleKey(),
  })

  const res = await fetch(`${GOOGLE_BASE}/place/autocomplete/json?${params}`, { cache: "no-store" })
  if (!res.ok) throw new Error("google_autocomplete_failed")

  const data = (await res.json()) as GoogleAutocompleteResponse
  const predictions = data.predictions ?? []
  const details = await Promise.all(
    predictions.map(async (prediction) => {
      const detail = await getGoogleAddressDetail(prediction.place_id)
      if (!detail) return null
      return {
        id: encodeAddress(detail),
        address: detail.addr,
        mainText: prediction.structured_formatting?.main_text || detail.street || detail.addr,
        secondaryText: prediction.structured_formatting?.secondary_text || formatLabel([detail.city, detail.postcode]),
        detail,
      }
    }),
  )

  return details.filter((item): item is AddressSuggestion => Boolean(item))
}

async function getGoogleAddressDetail(placeId: string): Promise<AddressLeg | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "formatted_address,address_components,geometry",
    key: googleKey(),
  })
  const res = await fetch(`${GOOGLE_BASE}/place/details/json?${params}`, { cache: "no-store" })
  if (!res.ok) throw new Error("google_detail_failed")

  const data = (await res.json()) as GoogleDetailsResponse
  const result = data.result
  if (!result?.geometry?.location) return null

  const streetNumber = component(result.address_components, "street_number")
  const route = component(result.address_components, "route")
  const city =
    component(result.address_components, "postal_town") ||
    component(result.address_components, "locality") ||
    component(result.address_components, "administrative_area_level_2")
  const postcode = component(result.address_components, "postal_code")
  const street = [streetNumber, route].filter(Boolean).join(" ").trim()

  return {
    addr: result.formatted_address || formatLabel([street, city, postcode]),
    street: street || result.formatted_address || "",
    city,
    postcode,
    lat: result.geometry.location.lat,
    long: result.geometry.location.lng,
    stairs: 0,
  }
}

function hasCoords(leg: AddressLeg): leg is AddressLeg & { lat: number; long: number } {
  return typeof leg.lat === "number" && Number.isFinite(leg.lat) && typeof leg.long === "number" && Number.isFinite(leg.long)
}

function haversineKm(a: AddressLeg, b: AddressLeg): number {
  if (!hasCoords(a) || !hasCoords(b)) return 0
  const radius = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.long - a.long) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

async function osrmLeg(from: AddressLeg & { lat: number; long: number }, to: AddressLeg & { lat: number; long: number }) {
  const coords = `${from.long},${from.lat};${to.long},${to.lat}`

  // TODO: Replace with production routing API before going live
  const res = await fetch(`${OSRM_BASE}/route/v1/driving/${coords}?overview=false`, { cache: "no-store" })
  if (!res.ok) throw new Error("osrm_route_failed")

  const data = (await res.json()) as OsrmResponse
  const route = data.routes?.[0]
  if (data.code !== "Ok" || typeof route?.duration !== "number" || typeof route.distance !== "number") {
    throw new Error("osrm_route_not_found")
  }

  return { distanceMeters: route.distance, durationSeconds: route.duration }
}

export async function getJourneySummary(legs: AddressLeg[]): Promise<JourneySummary> {
  const usable = legs.filter((leg): leg is AddressLeg & { lat: number; long: number } => Boolean(leg.addr) && hasCoords(leg))
  if (usable.length < 2) return { distanceKm: 0, durationMinutes: 0, source: "haversine" }

  if (geoProvider() === "google") {
    try {
      return await getGoogleJourneySummary(usable)
    } catch {
      return getFallbackJourneySummary(usable)
    }
  }

  try {
    let distanceMeters = 0
    let durationSeconds = 0

    for (let i = 0; i < usable.length - 1; i += 1) {
      const leg = await osrmLeg(usable[i], usable[i + 1])
      distanceMeters += leg.distanceMeters
      durationSeconds += leg.durationSeconds
    }

    return {
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      source: "osrm",
    }
  } catch {
    return getFallbackJourneySummary(usable)
  }
}

async function getGoogleJourneySummary(usable: Array<AddressLeg & { lat: number; long: number }>): Promise<JourneySummary> {
  let distanceMeters = 0
  let durationSeconds = 0

  for (let i = 0; i < usable.length - 1; i += 1) {
    const from = usable[i]
    const to = usable[i + 1]
    const params = new URLSearchParams({
      origins: `${from.lat},${from.long}`,
      destinations: `${to.lat},${to.long}`,
      mode: "driving",
      units: "metric",
      key: googleKey(),
    })
    const res = await fetch(`${GOOGLE_BASE}/distancematrix/json?${params}`, { cache: "no-store" })
    if (!res.ok) throw new Error("google_distance_failed")
    const data = (await res.json()) as GoogleDistanceResponse
    const element = data.rows?.[0]?.elements?.[0]
    if (element?.status !== "OK" || !element.distance || !element.duration) throw new Error("google_distance_not_found")
    distanceMeters += element.distance.value
    durationSeconds += element.duration.value
  }

  return {
    distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
    durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    source: "google",
  }
}

function getFallbackJourneySummary(usable: Array<AddressLeg & { lat: number; long: number }>): JourneySummary {
  const distanceKm = usable.slice(0, -1).reduce((sum, leg, i) => sum + haversineKm(leg, usable[i + 1]), 0)
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes: Math.max(1, Math.round((distanceKm / 45) * 60)),
    source: "haversine",
  }
}
