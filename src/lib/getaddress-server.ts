const BASE = "https://api.getAddress.io"

export type AutocompleteSuggestion = {
  id: string
  address: string
}

export async function getAddressAutocomplete(term: string, apiKey: string): Promise<AutocompleteSuggestion[]> {
  const trimmed = term.trim()
  if (trimmed.length < 2) return []
  const path = encodeURIComponent(trimmed)
  const url = `${BASE}/autocomplete/${path}?api-key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  const data = (await res.json()) as { suggestions?: { id: string; address: string }[] }
  if (!Array.isArray(data.suggestions)) return []
  return data.suggestions.map((s) => ({ id: s.id, address: s.address }))
}

export type ResolvedAddress = {
  line: string
  postcode: string
  raw: unknown
}

export async function getAddressById(id: string, apiKey: string): Promise<ResolvedAddress | null> {
  const path = encodeURIComponent(id)
  const url = `${BASE}/get/${path}?api-key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  const data = (await res.json()) as Record<string, unknown>

  const postcode =
    (typeof data.postcode === "string" && data.postcode) ||
    (typeof data.Postcode === "string" && data.Postcode) ||
    ""

  let line = ""
  if (Array.isArray(data.formatted_address)) {
    line = (data.formatted_address as string[]).filter(Boolean).join(", ")
  } else if (typeof data.line_1 === "string") {
    const parts = [data.line_1, data.line_2, data.line_3, data.line_4].filter(
      (p): p is string => typeof p === "string" && p.length > 0,
    )
    line = parts.join(", ")
  } else if (typeof data.formatted_address === "string") {
    line = data.formatted_address
  }

  if (!line && typeof data.thoroughfare === "string") {
    line = [data.building_number, data.thoroughfare, data.town_or_city].filter(Boolean).join(", ") as string
  }

  if (!line) {
    line = typeof data.address === "string" ? data.address : "Address"
  }

  return { line: line.trim(), postcode: String(postcode).trim(), raw: data }
}
