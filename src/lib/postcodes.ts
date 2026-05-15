type PostcodesIoResult = {
  status: number
  result?: { latitude: number; longitude: number }
}

function normalizePostcode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, " ")
}

export async function lookupPostcodeCoords(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const pc = normalizePostcode(postcode)
  if (pc.length < 5) return null
  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`
  try {
    const res = await fetch(url, { cache: "no-store" })
    const data = (await res.json()) as PostcodesIoResult
    if (!res.ok || !data.result) return null
    return { lat: data.result.latitude, lng: data.result.longitude }
  } catch {
    return null
  }
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}
