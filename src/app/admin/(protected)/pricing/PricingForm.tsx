"use client"

import type { PricingConfig } from "@/lib/pricing"
import { useState } from "react"

type Field = { key: keyof PricingConfig; label: string; description: string; type: "text" | "number"; step?: string; prefix?: string }

const FIELDS: Field[] = [
  { key: "companyName", label: "Company name", description: "Shown to customers on the quotes page", type: "text" },
  { key: "rating", label: "Star rating", description: "Displayed as e.g. ★ 4.9", type: "number", step: "0.1" },
  { key: "reviewCount", label: "Review count", description: "Shown next to the star rating", type: "number" },
  { key: "smallVanRate", label: "Small van — hourly rate", description: "Price per hour for a small van", type: "number", prefix: "£" },
  { key: "mediumVanRate", label: "Medium van — hourly rate", description: "Price per hour for a medium van", type: "number", prefix: "£" },
  { key: "largeVanRate", label: "Large van — hourly rate", description: "Price per hour for a large van", type: "number", prefix: "£" },
  { key: "lutonVanRate", label: "Luton van — hourly rate", description: "Price per hour for a Luton van", type: "number", prefix: "£" },
  { key: "helper2Rate", label: "2 helpers — extra per hour", description: "Added to the hourly rate when 2 helpers are booked", type: "number", prefix: "£" },
  { key: "helper3Rate", label: "3 helpers — extra per hour", description: "Added to the hourly rate when 3 helpers are booked", type: "number", prefix: "£" },
  { key: "stairRate", label: "Cost per flight of stairs", description: "Charged once per flight (collection + delivery combined)", type: "number", prefix: "£" },
  { key: "stopRate", label: "Cost per extra stop", description: "Charged once per additional stop between collection and delivery", type: "number", prefix: "£" },
  { key: "minHours", label: "Minimum booking hours", description: "Customers cannot book fewer hours than this", type: "number" },
  { key: "maxHours", label: "Maximum booking hours", description: "Customers cannot book more hours than this", type: "number" },
]

export default function PricingForm({ initialValues }: { initialValues: PricingConfig }) {
  const [values, setValues] = useState<PricingConfig>(initialValues)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function handleChange(key: keyof PricingConfig, raw: string) {
    const field = FIELDS.find((f) => f.key === key)!
    const value = field.type === "number" ? (raw === "" ? 0 : parseFloat(raw)) : raw
    setValues((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-2xl space-y-6">
      {FIELDS.map((field) => (
        <div key={field.key} className="rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4">
          <label htmlFor={field.key} className="mb-1 block text-sm font-medium text-white">{field.label}</label>
          <p className="mb-3 text-xs text-[#94A3B8]">{field.description}</p>
          <div className="flex items-center gap-2">
            {field.prefix && <span className="text-[#94A3B8]">{field.prefix}</span>}
            <input
              id={field.key}
              aria-label={field.label}
              type={field.type}
              step={field.step ?? (field.type === "number" ? "0.01" : undefined)}
              min={field.type === "number" ? 0 : undefined}
              value={values[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-48 rounded border border-[rgba(255,255,255,0.12)] bg-[#0F1923] px-3 py-2 text-white focus:border-[#F59E0B] focus:outline-none"
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-[#F59E0B] px-6 py-2 font-semibold text-[#0F1923] hover:bg-[#D97706] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save pricing"}
        </button>
        {saved && <span className="text-sm text-green-400">✓ Saved successfully</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  )
}
