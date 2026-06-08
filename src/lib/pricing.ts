import { getJourneySummary } from "@/lib/geo-services"
import { prisma } from "@/lib/prisma"
import type { AddressLeg, DriverQuote, PriceBreakdown, QuoteRequest, VanType } from "@/types/quote"

export type PricingConfig = {
  companyName: string
  rating: number
  reviewCount: number
  smallVanRate: number
  mediumVanRate: number
  largeVanRate: number
  lutonVanRate: number
  helper2Rate: number
  helper3Rate: number
  stairRate: number
  stopRate: number
  minHours: number
  maxHours: number
}

const DEFAULTS: PricingConfig = {
  companyName: "Man and Van",
  rating: 4.9,
  reviewCount: 0,
  smallVanRate: 25,
  mediumVanRate: 35,
  largeVanRate: 45,
  lutonVanRate: 55,
  helper2Rate: 12,
  helper3Rate: 24,
  stairRate: 5,
  stopRate: 10,
  minHours: 5,
  maxHours: 17.5,
}

export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    const row = await prisma.pricingSettings.findUnique({ where: { id: "singleton" } })
    if (!row) return DEFAULTS
    return {
      companyName: row.companyName,
      rating: row.rating,
      reviewCount: row.reviewCount,
      smallVanRate: row.smallVanRate,
      mediumVanRate: row.mediumVanRate,
      largeVanRate: row.largeVanRate,
      lutonVanRate: row.lutonVanRate,
      helper2Rate: row.helper2Rate,
      helper3Rate: row.helper3Rate,
      stairRate: row.stairRate,
      stopRate: row.stopRate,
      minHours: row.minHours,
      maxHours: row.maxHours,
    }
  } catch {
    return DEFAULTS
  }
}

const VAN_LABELS: Record<VanType, string> = {
  0: "Small van",
  1: "Medium van",
  2: "Large van",
  3: "Luton van",
}

function vanRate(cfg: PricingConfig, vanType: VanType): number {
  return [cfg.smallVanRate, cfg.mediumVanRate, cfg.largeVanRate, cfg.lutonVanRate][vanType]
}

function helperRate(cfg: PricingConfig, helpers: number): number {
  if (helpers <= 1) return 0
  if (helpers === 2) return cfg.helper2Rate
  return cfg.helper3Rate
}

function stairsTotal(legs: AddressLeg[]): number {
  return legs.reduce((sum, leg) => sum + (Number.isFinite(leg.stairs) ? leg.stairs : 0), 0)
}

export function suggestedHours(durationMinutes: number, cfg: PricingConfig): number {
  const travelHours = durationMinutes / 60
  const rounded = Math.ceil((travelHours + 0.5) * 2) / 2
  return Math.min(cfg.maxHours, Math.max(cfg.minHours, rounded))
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
  return new Date(Date.UTC(year, month - 1, day, hour ?? 0, minute ?? 0, 0))
}

function calculatePrice(
  input: QuoteRequest,
  cfg: PricingConfig,
): { price: number; breakdown: PriceBreakdown } {
  const hours = input.hours
  const legs = [input.collection, ...input.stops, input.delivery]
  const hourlyRate = vanRate(cfg, input.vantype)
  const basePrice = hourlyRate * hours
  const hRate = helperRate(cfg, input.helpers)
  const helperCost = hRate * hours
  const stairCost = stairsTotal(legs) * cfg.stairRate
  const stopCost = input.stops.length * cfg.stopRate
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
  const [journey, cfg] = await Promise.all([
    getJourneySummary([input.collection, ...input.stops, input.delivery]),
    getPricingConfig(),
  ])

  const minHours = suggestedHours(journey.durationMinutes, cfg)
  const normalized: QuoteRequest = { ...input, hours: input.hours || minHours }
  const priced = calculatePrice(normalized, cfg)

  const quote: DriverQuote = {
    id: "main",
    companyName: cfg.companyName,
    vehicleType: VAN_LABELS[input.vantype],
    rating: cfg.rating,
    reviewCount: cfg.reviewCount,
    coverageInfo: `${journey.distanceKm.toFixed(1)} km route • ${formatDuration(journey.durationMinutes)} estimated drive`,
    price: priced.price,
    breakdown: priced.breakdown,
  }

  const minPreviewInput: QuoteRequest = { ...input, hours: minHours, helpers: 1, vantype: 0 }
  const minPrice = calculatePrice(minPreviewInput, cfg).price

  return { journey, minHours, minPrice, quotes: [quote] }
}

export const vanLabels = VAN_LABELS

type StoredBookingFields = {
  bookedHours: number | null
  bookedVanType: number | null
  helpers: number
  collectionStairs: number
  deliveryStairs: number
  stops: unknown
}

export async function recomputeBookingPrice(booking: StoredBookingFields): Promise<number> {
  const cfg = await getPricingConfig()
  const vanType = (booking.bookedVanType ?? 0) as VanType
  const hours = booking.bookedHours ?? cfg.minHours
  const stopsCount = Array.isArray(booking.stops) ? (booking.stops as unknown[]).length : 0
  const totalStairs = booking.collectionStairs + booking.deliveryStairs

  const basePrice = vanRate(cfg, vanType) * hours
  const hCost = helperRate(cfg, booking.helpers) * hours
  const stairCost = totalStairs * cfg.stairRate
  const stopCost = stopsCount * cfg.stopRate

  return Math.round((basePrice + hCost + stairCost + stopCost) * 100) / 100
}
