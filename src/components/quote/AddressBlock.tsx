"use client"

import type { AddressLeg } from "@/types/quote"
import { useCallback, useEffect, useId, useRef, useState } from "react"

type Suggestion = { id: string; address: string; mainText?: string; secondaryText?: string; detail?: AddressLeg }

type Props = {
  title: string
  searchLabel: string
  leg: AddressLeg
  onChange: (next: AddressLeg) => void
  compact?: boolean
}

const stairsOptions = [
  { value: 0, label: "are no flights of stairs or lift is available" },
  { value: 1, label: "is 1 flight of stairs" },
  { value: 2, label: "are 2 flights of stairs" },
  { value: 3, label: "are 3 flights of stairs" },
  { value: 4, label: "are 4 flights of stairs" },
  { value: 5, label: "are 5 flights of stairs" },
  { value: 6, label: "are 6 flights of stairs" },
  { value: 7, label: "are 7 flights of stairs" },
  { value: 8, label: "are 8 flights of stairs" },
  { value: 9, label: "are 8+ flights of stairs" },
]

export const emptyAddressLeg = (): AddressLeg => ({
  addr: "",
  street: "",
  city: "",
  postcode: "",
  lat: null,
  long: null,
  stairs: 0,
})

export function AddressBlock({ title, searchLabel, leg, onChange, compact = false }: Props) {
  const baseId = useId()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [])

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 3) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/addresses/autocomplete?term=${encodeURIComponent(term)}`)
      const data = (await res.json()) as { suggestions?: Suggestion[] }
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void search(leg.addr), 260)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [leg.addr, search])

  async function pickSuggestion(suggestion: Suggestion) {
    setOpen(false)
    setLoading(true)
    try {
      if (suggestion.detail) {
        onChange({ ...suggestion.detail, stairs: leg.stairs })
        return
      }

      const res = await fetch(`/api/addresses/detail?id=${encodeURIComponent(suggestion.id)}`)
      if (!res.ok) {
        onChange({ ...leg, addr: suggestion.address })
        return
      }
      const detail = (await res.json()) as AddressLeg
      onChange({ ...detail, stairs: leg.stairs })
    } catch {
      onChange({ ...leg, addr: suggestion.address })
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    onChange(emptyAddressLeg())
    setSuggestions([])
  }

  return (
    <section className={compact ? "" : "rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4"}>
      {!compact ? (
        <h3 className="text-lg font-bold text-[#F1F5F9]">
          {title} <span className="text-[#F59E0B]">?</span>
        </h3>
      ) : null}

      <div ref={wrapRef} className={compact ? "relative" : "relative mt-4"}>
        <label htmlFor={`${baseId}-addr`} className="mb-1 block text-[13px] font-medium uppercase tracking-[0.04em] text-[#94A3B8]">
          {searchLabel}
        </label>
        <div className="relative">
          <input
            id={`${baseId}-addr`}
            type="text"
            value={leg.addr}
            placeholder="Start typing, then select address"
            autoComplete="new-password"
            onChange={(e) => {
              onChange({ ...leg, addr: e.target.value, lat: null, long: null })
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className="w-full rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-3 pr-10 text-base text-[#F1F5F9] outline-none placeholder:text-[#4B5563] focus:border-[#F59E0B] focus:ring-2 focus:ring-[rgba(245,158,11,0.15)]"
          />
          {leg.addr ? (
            <button
              type="button"
              aria-label="Clear address"
              onClick={clear}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#94A3B8] hover:bg-[#223040] hover:text-[#F59E0B]"
            >
              x
            </button>
          ) : null}
        </div>
        {open && suggestions.length > 0 ? (
          <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded border border-[rgba(255,255,255,0.1)] bg-[#1A2733] py-1 text-sm shadow-xl">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-[#94A3B8] hover:bg-[#223040]"
                  onClick={() => void pickSuggestion(suggestion)}
                >
                  <strong className="text-[#F59E0B]">{suggestion.mainText || suggestion.address}</strong>
                  {suggestion.secondaryText ? <span className="block text-xs text-[#94A3B8]">{suggestion.secondaryText}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {loading ? <p className="mt-1 text-xs text-[#94A3B8]">Searching addresses...</p> : null}
      </div>

      {!compact ? (
        <>
          <div className="mt-4">
            <label htmlFor={`${baseId}-stairs`} className="mb-1 block text-[13px] font-medium uppercase tracking-[0.04em] text-[#94A3B8]">
              At this address there
            </label>
            <select
              id={`${baseId}-stairs`}
              value={leg.stairs}
              onChange={(e) => onChange({ ...leg, stairs: Number(e.target.value) })}
              className="w-full rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-3 text-base text-[#F1F5F9] outline-none [color-scheme:dark] focus:border-[#F59E0B] focus:ring-2 focus:ring-[rgba(245,158,11,0.15)]"
            >
              {stairsOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr_1fr]">
            <ReadonlyField label="Post code" value={leg.postcode} />
            <ReadonlyField label="Street address" value={leg.street} />
            <ReadonlyField label="City" value={leg.city} />
          </div>
        </>
      ) : null}
    </section>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-[13px] font-medium uppercase tracking-[0.04em] text-[#94A3B8]">
      {label}
      <input
        value={value}
        placeholder="Search address above"
        readOnly
        className="mt-1 w-full rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-base text-[#94A3B8] placeholder:text-[#4B5563]"
      />
    </label>
  )
}
