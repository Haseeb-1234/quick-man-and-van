"use client"

import { Button } from "@/components/ui/Button"
import { useState } from "react"

const inputClass = "mt-1 w-full rounded border border-[var(--input-border)] bg-input-bg p-3 text-sm text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
const labelClass = "block text-xs font-medium uppercase tracking-wide text-secondary"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, message }),
      })
      if (res.ok) {
        setStatus("sent")
        setName(""); setEmail(""); setPhone(""); setMessage("")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
        <p className="font-semibold">Message sent!</p>
        <p className="mt-1 text-sm">We&apos;ll get back to you as soon as possible.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="contact-name" className={labelClass}>Full name</label>
        <input id="contact-name" type="text" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className={inputClass} />
      </div>
      <div>
        <label htmlFor="contact-email" className={labelClass}>Email address</label>
        <input id="contact-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className={inputClass} />
      </div>
      <div>
        <label htmlFor="contact-phone" className={labelClass}>Phone <span className="normal-case font-normal">(optional)</span></label>
        <input id="contact-phone" type="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} placeholder="07700 000000" className={inputClass} />
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass}>Message</label>
        <textarea id="contact-message" required minLength={10} maxLength={2000} rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us about your move or question..." className={inputClass} />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">Something went wrong. Please try again or call us directly.</p>
      )}
      <Button type="submit" className="btn-primary w-full" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
