import { getJourneySummary } from "@/lib/geo-services"
import type { AddressLeg, DriverQuote, PriceBreakdown, QuoteRequest, VanType } from "@/types/quote"

const HOURLY_RATES: Record<VanType, number> = {
  0: 25,
  1: 35,
  2: 45,
  3: 55,
}

const HELPER_RATES: Record<number, number> = {
  0: 0,
  1: 0,
  2: 12,
  3: 24,
}

const VAN_LABELS: Record<VanType, string> = {
  0: "Small van",
  1: "Medium van",
  2: "Large van",
  3: "Luton van",
}

const STAIR_RATE = 5
const STOP_RATE = 10

const PROVIDERS = [
  { id: "swift", companyName: "Swift Man and Van", rating: 4.9, reviewCount: 214, hourlyAdjust: -3, vanMax: 3 },
  { id: "capital", companyName: "Capital Move Team", rating: 4.8, reviewCount: 168, hourlyAdjust: 0, vanMax: 3 },
  { id: "metro", companyName: "Metro Van Services", rating: 4.7, reviewCount: 119, hourlyAdjust: 4, vanMax: 2 },
  { id: "prime", companyName: "Prime Luton Moves", rating: 4.9, reviewCount: 87, hourlyAdjust: 8, vanMax: 3 },
]

function stairsTotal(legs: AddressLeg[]): number {
  return legs.reduce((sum, leg) => sum + (Number.isFinite(leg.stairs) ? leg.stairs : 0), 0)
}

export function suggestedHours(durationMinutes: number): number {
  const travelHours = durationMinutes / 60
  const rounded = Math.ceil((travelHours + 0.5) * 2) / 2
  return Math.min(17.5, Math.max(5, rounded))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} hours and ${m} minutes` : `${h} hours`
}

export function parseMoveDateTime(date: string, time: string): Date {
  const [day, month, year] = date.split("/").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0, 0))
}

function calculatePrice(input: QuoteRequest, hourlyRate: number): { price: number; breakdown: PriceBreakdown } {
  const hours = input.hours
  const legs = [input.collection, ...input.stops, input.delivery]
  const basePrice = hourlyRate * hours
  const helperCost = (HELPER_RATES[input.helpers] ?? 0) * hours
  const stairCost = stairsTotal(legs) * STAIR_RATE
  const stopCost = input.stops.length * STOP_RATE
  const subtotal = basePrice + helperCost + stairCost + stopCost

  return {
    price: Math.round(subtotal * 100) / 100,
    breakdown: {
      hourlyRate,
      hours,
      basePrice: Math.round(basePrice * 100) / 100,
      helperCost: Math.round(helperCost * 100) / 100,
      stairCost,
      stopCost,
      subtotal: Math.round(subtotal * 100) / 100,
    },
  }
}

export async function computeQuotes(input: QuoteRequest): Promise<{
  journey: Awaited<ReturnType<typeof getJourneySummary>>
  minHours: number
  minPrice: number
  quotes: DriverQuote[]
}> {
  const legs = [input.collection, ...input.stops, input.delivery]
  const journey = await getJourneySummary(legs)
  const minHours = suggestedHours(journey.durationMinutes)
  const normalized: QuoteRequest = { ...input, hours: input.hours || minHours }

  const quotes = PROVIDERS.filter((provider) => provider.vanMax >= input.vantype)
    .map((provider) => {
      const hourlyRate = Math.max(20, HOURLY_RATES[input.vantype] + provider.hourlyAdjust)
      const priced = calculatePrice(normalized, hourlyRate)
      return {
        id: provider.id,
        companyName: provider.companyName,
        vehicleType: VAN_LABELS[input.vantype],
        rating: provider.rating,
        reviewCount: provider.reviewCount,
        coverageInfo: `${journey.distanceKm.toFixed(1)} km route • ${formatDuration(journey.durationMinutes)} estimated drive`,
        price: priced.price,
        breakdown: priced.breakdown,
      }
    })
    .sort((a, b) => a.price - b.price)

  const minPreviewInput: QuoteRequest = { ...input, hours: minHours, helpers: 1, vantype: 0 }
  const minPrice = calculatePrice(minPreviewInput, HOURLY_RATES[0]).price

  return { journey, minHours, minPrice, quotes }
}

export const vanLabels = VAN_LABELS
