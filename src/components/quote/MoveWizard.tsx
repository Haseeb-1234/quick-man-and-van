"use client"

import { AddressBlock, emptyAddressLeg } from "@/components/quote/AddressBlock"
import { Button, ButtonLink } from "@/components/ui/Button"
import type { AddressLeg, DriverQuote, JourneySummary, QuoteRequest, VanType } from "@/types/quote"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

const VAN_OPTIONS: { value: VanType; label: string; dimensions: string; payload: string; seats: number }[] = [
  { value: 0, label: "Small van", dimensions: "1.7m x 1.49m x 1.2m", payload: "600-800kg", seats: 2 },
  { value: 1, label: "Medium van", dimensions: "2.4m x 1.7m x 1.4m", payload: "800-1200kg", seats: 3 },
  { value: 2, label: "Large van", dimensions: "3.4m x 1.7m x 1.8m", payload: "1200-1500kg", seats: 3 },
  { value: 3, label: "Luton van", dimensions: "4.1m x 2.0m x 2.2m", payload: "1200-1600kg", seats: 3 },
]

const HELPER_OPTIONS = [
  { value: 0, label: "No help needed", icon: "1" },
  { value: 1, label: "Driver helping", icon: "1" },
  { value: 2, label: "Driver + 1 person helping", icon: "2" },
  { value: 3, label: "Driver + 2 people helping", icon: "3" },
]

type QuoteResponse = {
  journey: JourneySummary
  minHours: number
  minPrice: number
  quotes: DriverQuote[]
}

function tomorrowUk(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function isoToUk(value: string): string {
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

function ukToIso(value: string): string {
  const [day, month, year] = value.split("/")
  return `${year}-${month}-${day}`
}

function hasSelectedAddress(leg: AddressLeg): boolean {
  return Boolean(leg.addr.trim() && leg.lat != null && leg.long != null)
}

function numberParam(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function addressFromParams(params: URLSearchParams, prefix: "collect" | "deliver"): AddressLeg {
  const homeStairs = params.get("home_stairs") === "1" ? 1 : 0
  return {
    addr: params.get(`${prefix}addr`) || "",
    street: params.get(`${prefix}street`) || "",
    city: params.get(`${prefix}city`) || "",
    postcode: params.get(`${prefix}postcode`) || "",
    lat: numberParam(params.get(`${prefix}lat`)),
    long: numberParam(params.get(`${prefix}long`)),
    stairs: homeStairs,
  }
}

function hoursOptions() {
  const out: number[] = []
  for (let h = 5; h <= 17.5; h += 0.5) out.push(h)
  return out
}

type MoveWizardProps = {
  initialStep?: number
}

export function MoveWizard({ initialStep = 1 }: MoveWizardProps) {
  const params = useSearchParams()
  const [step, setStep] = useState(initialStep)
  const [collection, setCollection] = useState<AddressLeg>(() => addressFromParams(params, "collect"))
  const [delivery, setDelivery] = useState<AddressLeg>(() => addressFromParams(params, "deliver"))
  const [stops, setStops] = useState<AddressLeg[]>(() => (params.get("home_stops") === "1" ? [emptyAddressLeg()] : []))
  const [vantype, setVantype] = useState<VanType>(1)
  const [hours, setHours] = useState(5)
  const [helpers, setHelpers] = useState(1)
  const [date, setDate] = useState(tomorrowUk)
  const [time, setTime] = useState("09:00")
  const [clientname, setClientname] = useState("")
  const [clientemail, setClientemail] = useState("")
  const [clientphone, setClientphone] = useState("")
  const [message, setMessage] = useState("")
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function setWizardStep(nextStep: number) {
    setStep(nextStep)
    if (typeof window === "undefined") return
    const path = `/move/${nextStep}`
    window.history.pushState({}, "", path)
  }

  const payload: QuoteRequest = useMemo(
    () => ({
      collection,
      stops: stops.filter((stop) => stop.addr.trim()),
      delivery,
      vantype,
      hours,
      helpers,
      date,
      time,
      clientname,
      clientemail,
      clientphone,
      message,
      submitter: params.get("submitter") || "submit",
    }),
    [collection, stops, delivery, vantype, hours, helpers, date, time, clientname, clientemail, clientphone, message, params],
  )

  async function calculate(nextStep?: number) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as QuoteResponse & { error?: string }
      if (!res.ok) {
        setError(data.error || "Could not calculate quotes. Check the address fields and API key.")
        return false
      }
      setQuoteData(data)
      setHours((current) => (current < data.minHours ? data.minHours : current))
      if (nextStep) setWizardStep(nextStep)
      return true
    } catch {
      setError("Network error while calculating quotes.")
      return false
    } finally {
      setLoading(false)
    }
  }

  async function continueFromRoute() {
    if (!hasSelectedAddress(collection) || !hasSelectedAddress(delivery)) {
      setError("Please select both collection and delivery addresses from the dropdown.")
      return
    }
    if (stops.some((stop) => stop.addr.trim() && !hasSelectedAddress(stop))) {
      setError("Each stop point must be selected from the address dropdown, or removed.")
      return
    }
    await calculate(2)
  }

  async function continueFromDetails() {
    await calculate(3)
  }

  async function finish() {
    if (!clientname.trim() || !clientemail.trim() || !clientphone.trim()) {
      setError("Please enter your name, email, and phone number.")
      return
    }
    const ok = await calculate(4)
    if (ok) setSubmitted(true)
  }

  const passengerSpaces = Math.max(0, (VAN_OPTIONS.find((v) => v.value === vantype)?.seats || 3) - Math.max(1, helpers))

  return (
    <main>
      <section className="bg-[linear-gradient(rgba(23,38,70,.82),rgba(23,38,70,.82)),url('/images/moving-hero.jpg')] bg-cover bg-center text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <h1 className="text-4xl font-bold sm:text-5xl">Instant Quotes</h1>
          <p className="mt-6 text-2xl font-bold">
            {step === 1 ? "What's the moving route?" : step === 2 ? `Your quote could be as little as £${quoteData?.minPrice.toFixed(2) ?? "..."}` : "Last step before your free quotes!"}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Progress step={step} />
        {error ? <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {step === 1 ? (
          <div className="space-y-6">
            <p className="text-zinc-700">
              Start typing in the address search boxes, then select the address from the dropdown box that appears while you type.
            </p>
            <AddressBlock title="Collection address" searchLabel="Search collection address" leg={collection} onChange={setCollection} />
            {stops.map((stop, index) => (
              <div key={index} className="relative">
                <button
                  type="button"
                  onClick={() => setStops((current) => current.filter((_, i) => i !== index))}
                  className="mb-2 rounded bg-amber-500 px-3 py-1 text-xs font-bold uppercase text-white"
                >
                  x Remove stop point
                </button>
                <AddressBlock
                  title={`Stop point ${index + 1}`}
                  searchLabel="Search address"
                  leg={stop}
                  onChange={(next) => setStops((current) => current.map((item, i) => (i === index ? next : item)))}
                />
              </div>
            ))}
            {stops.length < 3 ? (
              <div className="text-center">
                <Button type="button" onClick={() => setStops((current) => [...current, emptyAddressLeg()])}>
                  Add stop point
                </Button>
              </div>
            ) : null}
            <AddressBlock title="Delivery address" searchLabel="Search delivery address" leg={delivery} onChange={setDelivery} />
            <div className="text-center">
              <Button type="button" className="px-10 uppercase" onClick={() => void continueFromRoute()} disabled={loading}>
                {loading ? "Calculating..." : "Next"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-10">
            <p className="text-zinc-700">
              In order to provide you with the lowest prices for your move, please tell us more about your move. After you fill the
              required information you will instantly receive the lowest available prices for your move.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-zinc-900">What van size do you need?</h2>
              <p className="mt-2 text-sm text-zinc-600">
                The van size you select must fit all the items you wish to move. The quote is for one trip only.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {VAN_OPTIONS.map((van) => (
                  <OptionCard key={van.value} selected={vantype === van.value} onClick={() => setVantype(van.value)}>
                    <p className="font-bold">{van.dimensions}</p>
                    <p className="text-xs text-zinc-500">(Load space LxWxH)</p>
                    <div className="my-4 flex h-20 items-center justify-center rounded bg-zinc-100 text-4xl">▰</div>
                    <p className="font-bold">{van.label}</p>
                    <p className="text-xs text-zinc-500">Payload: {van.payload} • Seats: {van.seats} inc driver</p>
                  </OptionCard>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-zinc-900">How many hours do you need the van?</h2>
              <p className="mt-2 text-sm text-zinc-600">
                We estimate your journey will take {quoteData ? formatDurationClient(quoteData.journey.durationMinutes) : "a few minutes"}.
                Add loading and unloading time to the journey duration.
              </p>
              <label className="mt-5 block max-w-md text-sm font-bold text-zinc-800">
                I need van for
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-3"
                >
                  {hoursOptions().map((h) => (
                    <option key={h} value={h}>
                      {h} hours (including travel time)
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-zinc-900">Will you need help loading and unloading your items?</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Our drivers will gladly help loading and unloading, and can bring extra people for large items.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {HELPER_OPTIONS.map((option) => (
                  <OptionCard key={option.value} selected={helpers === option.value} onClick={() => setHelpers(option.value)}>
                    <div className="mx-auto mb-3 flex h-16 w-24 items-center justify-center rounded bg-zinc-100 text-2xl font-bold text-[#00bcd4]">
                      {option.icon}
                    </div>
                    <p className="font-bold">{option.label}</p>
                  </OptionCard>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-zinc-900">When are you planning to move?</h2>
              <p className="mt-2 text-sm text-zinc-600">Enter the date and time when you plan to move to check driver availability.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-zinc-800">
                  Planning to move on
                  <input
                    type="date"
                    value={ukToIso(date)}
                    onChange={(e) => setDate(isoToUk(e.target.value))}
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-3"
                  />
                </label>
                <label className="text-sm font-bold text-zinc-800">
                  at
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-3" />
                </label>
              </div>
              <p className="mt-5 rounded bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
                There will be room for {passengerSpaces} passenger{passengerSpaces === 1 ? "" : "s"} to travel in the van free of charge.
              </p>
            </section>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setWizardStep(1)}>
                Back
              </Button>
              <Button onClick={() => void continueFromDetails()} disabled={loading} className="uppercase">
                {loading ? "Checking..." : "Get free quotes"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-8">
            <p className="text-zinc-700">You are just one click away from your free quotes. Fill the final details and press the submit button.</p>
            <section className="rounded border border-zinc-200 bg-white p-5">
              <h2 className="text-2xl font-bold text-zinc-900">About you</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Your details are required to send you the quotes result. We will not send you spam or share your details.
              </p>
              <div className="mt-5 grid gap-4">
                <ClearableInput label="Your name" value={clientname} onChange={setClientname} required />
                <ClearableInput label="Your email" type="email" value={clientemail} onChange={setClientemail} required />
                <ClearableInput label="Your phone number" type="tel" value={clientphone} onChange={setClientphone} required />
                <label className="text-sm font-bold text-zinc-800">
                  Message
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 min-h-24 w-full rounded border border-zinc-300 px-3 py-3 font-normal"
                  />
                </label>
              </div>
            </section>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setWizardStep(2)}>
                Back
              </Button>
              <Button onClick={() => void finish()} disabled={loading} className="uppercase">
                {loading ? "Preparing..." : "Get free quotes"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 && quoteData ? (
          <div className="space-y-6">
            <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              {submitted ? "Your quote request is ready. Choose a provider below to continue to booking." : "Quotes ready."}
            </div>
            <div className="grid gap-4">
              {quoteData.quotes.map((quote) => (
                <article key={quote.id} className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900">{quote.companyName}</h2>
                      <p className="text-sm text-zinc-600">{quote.vehicleType}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        ★ {quote.rating.toFixed(1)} ({quote.reviewCount} reviews) • {quote.coverageInfo}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-bold text-zinc-900">£{quote.price.toFixed(2)}</p>
                      <Button className="mt-3 uppercase">Book now</Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <ButtonLink href="/move" variant="outline">
              Start another quote
            </ButtonLink>
          </div>
        ) : null}

        {step === 4 && !quoteData ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h2 className="text-xl font-bold">No quote results loaded</h2>
            <p className="mt-2 text-sm">
              Quote results are created after completing the previous steps. Start from the route page and submit your details to
              generate live quotes.
            </p>
            <ButtonLink href="/move/1" variant="outline" className="mt-4">
              Start quote
            </ButtonLink>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function Progress({ step }: { step: number }) {
  const labels = ["Route", "Move details", "About you", "Quotes"]
  return (
    <ol className="mb-8 grid grid-cols-4 gap-2 text-xs font-bold uppercase text-zinc-500">
      {labels.map((label, index) => {
        const n = index + 1
        return (
          <li key={label} className={n <= step ? "text-[#00bcd4]" : ""}>
            <span className={`mb-2 block h-1 rounded ${n <= step ? "bg-[#00bcd4]" : "bg-zinc-200"}`} />
            {label}
          </li>
        )
      })}
    </ol>
  )
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 p-5 text-center transition ${
        selected ? "border-[#00bcd4] bg-cyan-50" : "border-zinc-200 bg-white hover:border-[#00bcd4]"
      }`}
    >
      {children}
    </button>
  )
}

function ClearableInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="text-sm font-bold text-zinc-800">
      {label}
      <div className="relative mt-1">
        <input
          type={type}
          value={value}
          required={required}
          placeholder={required ? "required" : "optional"}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-3 pr-10 font-normal"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            x
          </button>
        ) : null}
      </div>
    </label>
  )
}

function formatDurationClient(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} hours and ${m} minutes` : `${h} hours`
}
