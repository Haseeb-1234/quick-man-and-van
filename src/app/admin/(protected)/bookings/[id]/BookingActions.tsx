"use client"

import { BookingStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
  booking: {
    id: string
    status: BookingStatus
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
  }
}

export default function BookingActions({ booking }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(booking.status)
  const [name, setName] = useState(booking.contactName ?? "")
  const [email, setEmail] = useState(booking.contactEmail ?? "")
  const [phone, setPhone] = useState(booking.contactPhone ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function save(body: object) {
    setSaving(true)
    setSaved(false)
    setError("")
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status change */}
      <div className="rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Change status</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(BookingStatus).map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving || s === status}
              onClick={() => {
                if (window.confirm(`Change status to ${s}?`)) void save({ status: s }).then(() => setStatus(s))
              }}
              className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                s === status
                  ? "bg-[#F59E0B] text-[#0F1923]"
                  : "bg-[#0F1923] text-[#94A3B8] hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Edit contact */}
      <div className="rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Edit contact details</h2>
        <div className="space-y-3">
          {[
            { label: "Name", value: name, setter: setName, field: "contactName" },
            { label: "Email", value: email, setter: setEmail, field: "contactEmail" },
            { label: "Phone", value: phone, setter: setPhone, field: "contactPhone" },
          ].map(({ label, value, setter }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 text-xs text-[#94A3B8]">{label}</span>
              <input
                aria-label={label}
                value={value}
                onChange={(e) => { setter(e.target.value); setSaved(false) }}
                className="flex-1 rounded border border-[rgba(255,255,255,0.12)] bg-[#0F1923] px-3 py-1.5 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save({ contactName: name, contactEmail: email, contactPhone: phone })}
            className="rounded bg-[#F59E0B] px-4 py-1.5 text-sm font-semibold text-[#0F1923] hover:bg-[#D97706] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save contact"}
          </button>
          {saved && <span className="text-sm text-green-400">✓ Saved</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </div>
    </div>
  )
}
