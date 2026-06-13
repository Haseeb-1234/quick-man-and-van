"use client"

import { AddressBlock } from "@/components/quote/AddressBlock"
import { Button, ButtonLink } from "@/components/ui/Button"
import type { AddressLeg, DriverQuote, JourneySummary, QuoteRequest, VanType } from "@/types/quote"
import Image from "next/image"
import { emptyAddressLeg } from "@/types/quote"
import { useSearchParams } from "next/navigation"
import { DEPOSIT_PERCENT, DEPOSIT_RATE, REMAINDER_PERCENT } from "@/lib/payment-config"
import { useMemo, useRef, useState } from "react"

const VAN_OPTIONS: { value: VanType; label: string; dimensions: string; payload: string; seats: number; image: string }[] = [
  { value: 0, label: "Small van", dimensions: "1.7m x 1.49m x 1.2m", payload: "600-800kg", seats: 2, image: "/images/vans/van-small.png" },
  { value: 1, label: "Medium van", dimensions: "2.4m x 1.7m x 1.4m", payload: "800-1200kg", seats: 3, image: "/images/vans/van-medium.png" },
  { value: 2, label: "Large van", dimensions: "3.4m x 1.7m x 1.8m", payload: "1200-1500kg", seats: 3, image: "/images/vans/van-large.png" },
  { value: 3, label: "Luton van", dimensions: "4.1m x 2.0m x 2.2m", payload: "1200-1600kg", seats: 3, image: "/images/vans/van-luton.png" },
]

const HELPER_OPTIONS: { value: number; label: string; image: string | null }[] = [
  { value: 0, label: "No help needed", image: null },
  { value: 1, label: "Driver helping", image: "/images/helpers/helper-1.png" },
  { value: 2, label: "Driver + 1 person helping", image: "/images/helpers/helper-2.png" },
  { value: 3, label: "Driver + 2 people helping", image: "/images/helpers/helper-3.png" },
]

type QuoteResponse = {
  journey: JourneySummary
  minHours: number
  minPrice: number
  quotes: DriverQuote[]
}

type ApiError = {
  error?: string
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
  const stairsRaw = numberParam(params.get(`${prefix}_stairs`))
  const stairs = stairsRaw !== null && stairsRaw >= 0 && stairsRaw <= 9 ? Math.floor(stairsRaw) : 0
  return {
    addr: params.get(`${prefix}addr`) || "",
    street: params.get(`${prefix}street`) || "",
    city: params.get(`${prefix}city`) || "",
    postcode: params.get(`${prefix}postcode`) || "",
    lat: numberParam(params.get(`${prefix}lat`)),
    long: numberParam(params.get(`${prefix}long`)),
    stairs,
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
  const [stopKeys, setStopKeys] = useState<string[]>(() => (params.get("home_stops") === "1" ? [crypto.randomUUID()] : []))
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
  const [bookingLoading, setBookingLoading] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<"FULL" | "DEPOSIT">("FULL")
  const tripsDialogRef = useRef<HTMLDialogElement>(null)

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
      submitter: (["submit", "widget", "partner"] as const).includes(params.get("submitter") as never)
        ? (params.get("submitter") as "submit" | "widget" | "partner")
        : "submit",
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
      const data = (await readJsonResponse<QuoteResponse | ApiError>(res)) ?? {}
      if (!res.ok) {
        setError(getApiError(data) || "Could not calculate quotes. Please check your addresses and try again.")
        return false
      }
      if (!isQuoteResponse(data)) {
        setError("Could not calculate quotes. Please check your addresses and try again.")
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

  async function handleBookNow(quote: DriverQuote) {
    setError(null)
    setBookingLoading(quote.id)
    try {
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, selectedQuoteId: quote.id, paymentType }),
      })
      const bookingData = (await bookingRes.json()) as { bookingId?: string; checkoutToken?: string; error?: string }
      if (!bookingRes.ok) {
        setError(bookingData.error ?? "Could not create booking. Please try again.")
        return
      }

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingData.bookingId, checkoutToken: bookingData.checkoutToken }),
      })
      const checkoutData = (await checkoutRes.json()) as { url?: string; error?: string }
      if (!checkoutRes.ok) {
        setError(checkoutData.error ?? "Could not start checkout. Please try again.")
        return
      }

      if (checkoutData.url) {
        window.location.assign(checkoutData.url)
      }
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setBookingLoading(null)
    }
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
    <main className="bg-page text-primary">
      <section className="bg-[linear-gradient(rgba(15,25,35,.9),rgba(15,25,35,.9)),url('/images/hero-bg.png')] bg-cover bg-center text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">Instant Quotes</h1>
          <p className="mt-6 text-2xl font-bold text-white/70">
            {step === 1 ? "What's the moving route?" : step === 2 ? `Your quote could be as little as £${quoteData?.minPrice.toFixed(2) ?? "..."}` : "Last step before your free quotes!"}
          </p>
        </div>
      </section>

      <section className="surface-card mx-auto max-w-5xl px-4 py-10 shadow-[0_4px_24px_rgba(0,0,0,0.12)] sm:px-6">
        <Progress step={step} />
        {error ? <div className="error-banner mb-6 rounded px-4 py-3 text-sm">{error}</div> : null}

        {step === 1 ? (
          <div className="space-y-6">
            <p className="text-secondary">
              Start typing in the address search boxes, then select the address from the dropdown box that appears while you type.
            </p>
            <AddressBlock title="Collection address" searchLabel="Search collection address" leg={collection} onChange={setCollection} />
            {stops.map((stop, index) => (
              <div key={stopKeys[index]} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setStops((current) => current.filter((_, i) => i !== index))
                    setStopKeys((current) => current.filter((_, i) => i !== index))
                  }}
                  className="btn-secondary mb-2 rounded px-3 py-1 text-xs font-bold uppercase"
                >
                  × Remove stop point
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
                <Button type="button" className="btn-secondary" onClick={() => {
                  setStops((current) => [...current, emptyAddressLeg()])
                  setStopKeys((current) => [...current, crypto.randomUUID()])
                }}>
                  Add stop point
                </Button>
              </div>
            ) : null}
            <AddressBlock title="Delivery address" searchLabel="Search delivery address" leg={delivery} onChange={setDelivery} />
            <div className="text-center">
              <Button type="button" className="btn-primary px-10 uppercase" onClick={() => void continueFromRoute()} disabled={loading}>
                {loading ? "Calculating..." : "Next"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-10">
            <p className="text-secondary">
              In order to provide you with the lowest prices for your move, please tell us more about your move. After you fill the
              required information you will instantly receive the lowest available prices for your move.
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-primary">What van size do you need?</h2>
              <p className="mt-2 text-sm text-secondary">
                The van size you select must fit all the items you wish to move.{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  The quote is for ONE trip only. Additional trips will be charged extra by the driver.
                </span>{" "}
                <button
                  type="button"
                  onClick={() => tripsDialogRef.current?.showModal()}
                  className="text-accent underline underline-offset-2 hover:opacity-75"
                >
                  Read More
                </button>
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {VAN_OPTIONS.map((van) => (
                  <OptionCard key={van.value} selected={vantype === van.value} onClick={() => setVantype(van.value)}>
                    <p className="font-bold text-primary">{van.dimensions}</p>
                    <p className="text-xs text-secondary">(Load space LxWxH)</p>
                    <div className="relative my-4 h-20 w-full">
                      <Image src={van.image} alt={van.label} fill sizes="(max-width: 640px) calc(50vw - 48px), 220px" className="object-contain" />
                    </div>
                    <p className={vantype === van.value ? "font-bold text-accent" : "font-bold text-primary"}>{van.label}</p>
                    <p className="text-xs text-secondary">Payload: {van.payload} • Seats: {van.seats} inc driver</p>
                  </OptionCard>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">How many hours do you need the van?</h2>
              <p className="mt-2 text-sm text-secondary">
                We estimate your journey will take {quoteData ? formatDurationClient(quoteData.journey.durationMinutes) : "a few minutes"}.
                Add loading and unloading time to the journey duration.
              </p>
              <label className="mt-5 block max-w-md text-[13px] font-medium uppercase tracking-[0.04em] text-secondary">
                I need van for
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="scheme-adaptive mt-1 w-full rounded border border-[var(--input-border)] bg-input-bg p-3 font-normal text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
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
              <h2 className="text-2xl font-semibold text-primary">Will you need help loading and unloading your items?</h2>
              <p className="mt-2 text-sm text-secondary">
                Our drivers will gladly help loading and unloading, and can bring extra people for large items.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {HELPER_OPTIONS.map((option) => (
                  <OptionCard key={option.value} selected={helpers === option.value} onClick={() => setHelpers(option.value)}>
                    {option.image ? (
                      <div className="relative mx-auto mb-3 h-20 w-20">
                        <Image src={option.image} alt={option.label} fill sizes="80px" className="object-contain" />
                      </div>
                    ) : (
                      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent" aria-hidden="true">
                          <path d="M1 3h15v13H1z" />
                          <path d="M16 8h4l3 4v4h-7V8z" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      </div>
                    )}
                    <p className={helpers === option.value ? "font-bold text-accent" : "font-bold text-primary"}>{option.label}</p>
                  </OptionCard>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary">When are you planning to move?</h2>
              <p className="mt-2 text-sm text-secondary">Enter the date and time when you plan to move to check driver availability.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-[13px] font-medium uppercase tracking-[0.04em] text-secondary">
                  Planning to move on
                  <input
                    type="date"
                    value={ukToIso(date)}
                    onChange={(e) => setDate(isoToUk(e.target.value))}
                    className="scheme-adaptive mt-1 w-full rounded border border-[var(--input-border)] bg-input-bg p-3 font-normal text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </label>
                <label className="text-[13px] font-medium uppercase tracking-[0.04em] text-secondary">
                  at
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="scheme-adaptive mt-1 w-full rounded border border-[var(--input-border)] bg-input-bg p-3 font-normal text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </label>
              </div>
              <p className="mt-5 rounded bg-accent/8 px-4 py-3 text-sm text-secondary">
                There will be room for {passengerSpaces} passenger{passengerSpaces === 1 ? "" : "s"} to travel in the van free of charge.
              </p>
            </section>

            <div className="flex justify-between gap-3">
              <BackButton onClick={() => setWizardStep(1)} />
              <Button onClick={() => void continueFromDetails()} disabled={loading} className="btn-primary uppercase">
                {loading ? "Checking..." : "Get free quotes"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-8">
            <p className="text-secondary">You are just one click away from your free quotes. Fill the final details and press the submit button.</p>
            <section className="surface-card rounded p-5">
              <h2 className="text-2xl font-semibold text-primary">About you</h2>
              <p className="mt-2 text-sm text-secondary">
                Your details are required to send you the quotes result. We will not send you spam or share your details.
              </p>
              <div className="mt-5 grid gap-4">
                <ClearableInput label="Your name" value={clientname} onChange={setClientname} required />
                <ClearableInput label="Your email" type="email" value={clientemail} onChange={setClientemail} required />
                <ClearableInput label="Your phone number" type="tel" value={clientphone} onChange={setClientphone} required />
                <label className="text-[13px] font-medium uppercase tracking-[0.04em] text-secondary">
                  Message
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 min-h-24 w-full rounded border border-[var(--input-border)] bg-input-bg p-3 font-normal normal-case tracking-normal text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </label>
              </div>
            </section>
            <div className="flex justify-between gap-3">
              <BackButton onClick={() => setWizardStep(2)} />
              <Button onClick={() => void finish()} disabled={loading} className="btn-primary uppercase">
                {loading ? "Preparing..." : "Get free quotes"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 && quoteData ? (
          <div className="space-y-6">
            <div className="rounded border border-accent/30 bg-accent/8 px-4 py-3 text-primary">
              {submitted ? "Your quote request is ready. Choose a provider below to continue to booking." : "Quotes ready."}
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-surface p-5">
              <h3 className="text-base font-semibold text-primary">How would you like to pay?</h3>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType("FULL")}
                  className={`flex-1 rounded-lg border-2 p-3 text-center text-sm font-semibold transition ${
                    paymentType === "FULL"
                      ? "border-accent bg-accent/8 text-accent"
                      : "border-[var(--border)] text-secondary hover:border-accent/40"
                  }`}
                >
                  Pay in full
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("DEPOSIT")}
                  className={`flex-1 rounded-lg border-2 p-3 text-center text-sm font-semibold transition ${
                    paymentType === "DEPOSIT"
                      ? "border-accent bg-accent/8 text-accent"
                      : "border-[var(--border)] text-secondary hover:border-accent/40"
                  }`}
                >
                  {DEPOSIT_PERCENT}% deposit now
                </button>
              </div>
              {paymentType === "DEPOSIT" ? (
                <p className="mt-3 rounded border border-amber-400/30 bg-amber-400/8 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                  Pay <strong>{DEPOSIT_PERCENT}% of the total now</strong> to secure your booking. The remaining {REMAINDER_PERCENT}% can be settled by cash or bank transfer directly to the driver after the job is complete.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4">
              {quoteData.quotes.map((quote) => (
                <article key={quote.id} className="rounded border border-[var(--border)] bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-primary">{quote.companyName}</h2>
                      <p className="text-sm text-secondary">{quote.vehicleType}</p>
                      <p className="mt-1 text-sm text-secondary">
                        ★ {quote.rating.toFixed(1)} ({quote.reviewCount} reviews) • {quote.coverageInfo}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      {paymentType === "DEPOSIT" ? (
                        <>
                          <p className="font-display text-[32px] font-bold text-accent">£{(quote.price * DEPOSIT_RATE).toFixed(2)}</p>
                          <p className="text-xs text-secondary">{DEPOSIT_PERCENT}% deposit · Total: £{quote.price.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="font-display text-[32px] font-bold text-accent">£{quote.price.toFixed(2)}</p>
                      )}
                      <Button
                        className="btn-primary mt-3 uppercase"
                        onClick={() => void handleBookNow(quote)}
                        disabled={bookingLoading !== null}
                      >
                        {bookingLoading === quote.id ? "Booking..." : "Book now"}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-subtle p-5">
              <h3 className="text-base font-semibold text-primary">Congestion charge</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                If your route passes through the London Congestion Zone you will be charged extra. The Congestion Charge is a{" "}
                <strong className="text-primary">£18.00 daily charge</strong> if you drive within the Congestion Charge zone{" "}
                <strong className="text-primary">7:00–18:00 Monday–Friday</strong> and{" "}
                <strong className="text-primary">12:00–18:00 Saturday–Sunday and bank holidays</strong>. No charge between Christmas Day and New Year&apos;s Day bank holiday (inclusive). To learn more, visit the{" "}
                <a
                  href="https://tfl.gov.uk/modes/driving/congestion-charge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2 hover:opacity-75"
                >
                  TfL congestion charge page
                </a>
                .
              </p>
            </div>

            <div className="flex items-center justify-between">
              <BackButton onClick={() => setWizardStep(3)} />
              <ButtonLink href="/move" variant="outline" className="btn-secondary">
                Start another quote
              </ButtonLink>
            </div>
          </div>
        ) : null}

        {step === 4 && !quoteData ? (
          <div className="rounded border border-accent/30 bg-accent/8 p-5 text-primary">
            <h2 className="text-xl font-semibold">No quote results loaded</h2>
            <p className="mt-2 text-sm text-secondary">
              Quote results are created after completing the previous steps. Start from the route page and submit your details to
              generate live quotes.
            </p>
            <ButtonLink href="/move/1" variant="outline" className="btn-secondary mt-4">
              Start quote
            </ButtonLink>
          </div>
        ) : null}
      </section>

      <dialog
        ref={tripsDialogRef}
        aria-labelledby="trips-modal-title"
        className="relative m-auto w-full max-w-md rounded-lg border-0 bg-surface p-6 shadow-xl backdrop:bg-black/50"
      >
        <button
          type="button"
          onClick={() => tripsDialogRef.current?.close()}
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded text-secondary hover:bg-hover-bg hover:text-primary"
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="trips-modal-title" className="text-xl font-bold text-primary">Additional trips cost</h2>
        <p className="mt-4 text-sm leading-relaxed text-secondary">
          Your booking with us will cover the cost from Collection to Delivery (via stop points if defined). If you need to do an additional trip, please note that the driver will charge you extra for the mileage and for{" "}
          <strong className="text-primary">2 stop points</strong> for each additional trip (
          <strong className="text-primary">even if it is within the booking&apos;s time interval</strong>).
        </p>
        <h3 className="mt-5 text-base font-bold text-primary">Recommendation</h3>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          In general it is more efficient for the customer to order the right size van to move all items in one go (even if the mileage is short), rather than to order a smaller van and do multiple runs.
        </p>
        <button
          type="button"
          onClick={() => tripsDialogRef.current?.close()}
          className="mt-6 w-full rounded border border-[var(--border)] py-2 text-sm font-bold uppercase tracking-wider text-secondary hover:bg-hover-bg"
        >
          Close
        </button>
      </dialog>
    </main>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" className="btn-secondary gap-1.5" onClick={onClick}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back
    </Button>
  )
}

async function readJsonResponse<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type")
  if (!contentType?.includes("application/json")) return null
  return (await res.json()) as T
}

function isQuoteResponse(value: unknown): value is QuoteResponse {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<QuoteResponse>
  return (
    typeof candidate.minHours === "number" &&
    typeof candidate.minPrice === "number" &&
    Array.isArray(candidate.quotes) &&
    Boolean(candidate.journey)
  )
}

function getApiError(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined
  const error = (value as ApiError).error
  return typeof error === "string" ? error : undefined
}

const PROGRESS_LABELS = ["Route", "Move details", "About you", "Quotes"]

function Progress({ step }: { step: number }) {
  return (
    <ol className="mb-8 grid grid-cols-4 gap-2 text-xs font-bold uppercase text-secondary">
      {PROGRESS_LABELS.map((label, index) => {
        const n = index + 1
        return (
          <li key={label} className={n <= step ? "text-accent" : "text-muted"}>
            <span className={`mb-2 block h-1 rounded ${n < step ? "bg-accent/30" : n === step ? "bg-accent" : "bg-[var(--border)]"}`} />
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
        selected
          ? "border-accent bg-accent/8"
          : "border-[var(--border)] bg-subtle hover:border-accent/40"
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
    <label className="text-[13px] font-medium uppercase tracking-[0.04em] text-secondary">
      {label}
      <div className="relative mt-1">
        <input
          type={type}
          value={value}
          required={required}
          placeholder={required ? "required" : "optional"}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-[var(--input-border)] bg-input-bg p-3 pr-10 font-normal normal-case tracking-normal text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-secondary hover:bg-hover-bg hover:text-accent"
          >
            ×
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
