"use client"

import { AddressBlock } from "@/components/quote/AddressBlock"
import { Button } from "@/components/ui/Button"
import { emptyAddressLeg } from "@/types/quote"
import type { AddressLeg } from "@/types/quote"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function QuickQuoteWidget() {
  const router = useRouter()
  const [collection, setCollection] = useState<AddressLeg>(() => emptyAddressLeg())
  const [delivery, setDelivery] = useState<AddressLeg>(() => emptyAddressLeg())
  const [homeStairs, setHomeStairs] = useState(false)
  const [homeStops, setHomeStops] = useState(false)
  const [error, setError] = useState("")

  function submit() {
    if (!collection.addr || !delivery.addr || collection.lat == null || collection.long == null || delivery.lat == null || delivery.long == null) {
      setError("Please select collection and delivery addresses.")
      return
    }

    const stairsValue = homeStairs ? "1" : "0"
    const params = new URLSearchParams({
      ...legParams("collect", collection, stairsValue),
      ...legParams("deliver", delivery, stairsValue),
      home_stops: homeStops ? "1" : "0",
      submitter: "widget",
    })
    router.push(`/move?${params}`)
  }

  return (
    <div className="surface-card p-6 text-[#F1F5F9] shadow-[0_4px_24px_rgba(0,0,0,0.5)] sm:p-8">
      <h2 className="font-display text-3xl font-bold text-[#F1F5F9]">Man and Van Quotes</h2>
      <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
        Get <strong>free quotes</strong> for <strong>Man and Van service</strong> in under a minute. <strong>Book online</strong> and move.
      </p>

      <div className="mt-6 space-y-4 text-[#F1F5F9]">
        <AddressBlock title="Collection" searchLabel="Collection address" leg={collection} onChange={setCollection} compact />
        <AddressBlock title="Delivery" searchLabel="Delivery address" leg={delivery} onChange={setDelivery} compact />
      </div>

      <div className="mt-4 space-y-3 text-sm text-[#F1F5F9]">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={homeStairs} onChange={(e) => setHomeStairs(e.target.checked)} />
          There are stairs at the locations
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={homeStops} onChange={(e) => setHomeStops(e.target.checked)} />
          I need to define stop points
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}

      <Button type="button" className="btn-primary mt-5 w-full rounded py-3 uppercase" onClick={submit}>
        Get quotes
      </Button>

      <div className="mt-5 flex items-end justify-between gap-4 text-xs text-[#94A3B8]">
        <p>Discounts can be applied on next pages.</p>
        <a href="https://www.reviews.io/company-reviews/store/quickmanandvan-co-uk" target="_blank" rel="noreferrer" className="text-right text-[#F1F5F9]">
          <span className="block text-amber-300">★★★★★</span>
          on Reviews.io
        </a>
      </div>
    </div>
  )
}

function legParams(prefix: "collect" | "deliver", leg: AddressLeg, stairs = "0"): Record<string, string> {
  return {
    [`${prefix}addr`]: leg.addr,
    [`${prefix}street`]: leg.street,
    [`${prefix}city`]: leg.city,
    [`${prefix}postcode`]: leg.postcode,
    [`${prefix}lat`]: String(leg.lat ?? ""),
    [`${prefix}long`]: String(leg.long ?? ""),
    [`${prefix}_stairs`]: stairs,
  }
}
