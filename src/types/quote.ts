export type VanType = 0 | 1 | 2 | 3

export type AddressLeg = {
  addr: string
  street: string
  city: string
  postcode: string
  lat: number | null
  long: number | null
  stairs: number
}

export type QuoteRequest = {
  collection: AddressLeg
  stops: AddressLeg[]
  delivery: AddressLeg
  vantype: VanType
  hours: number
  helpers: number
  date: string
  time: string
  clientname?: string
  clientemail?: string
  clientphone?: string
  message?: string
  submitter?: string
}

export type JourneySummary = {
  distanceKm: number
  durationMinutes: number
  source: "google" | "osrm" | "haversine"
}

export type PriceBreakdown = {
  hourlyRate: number
  hours: number
  basePrice: number
  helperCost: number
  stairCost: number
  stopCost: number
  subtotal: number
}

export type DriverQuote = {
  id: string
  companyName: string
  vehicleType: string
  rating: number
  reviewCount: number
  coverageInfo: string
  price: number
  breakdown: PriceBreakdown
}
