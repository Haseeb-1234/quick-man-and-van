"use client"

import {
  DEFAULT_CUSTOMER_BODY,
  DEFAULT_CUSTOMER_SUBJECT,
  EMAIL_CHIPS,
  renderEmailBody,
  renderSubject,
  SAMPLE_EMAIL_VARS,
} from "@/lib/email-templates"
import { useRef, useState } from "react"

type EmailValues = { customerSubject: string; customerBody: string }

export default function EmailTemplateForm({ initialValues }: { initialValues: EmailValues }) {
  const [values, setValues] = useState<EmailValues>({
    customerSubject: initialValues.customerSubject,
    customerBody: initialValues.customerBody,
  })
  const [busy, setBusy] = useState<"save" | "test" | null>(null)
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Which field last had focus — only read in event handlers, so a ref (no re-render on focus change).
  const activeFieldRef = useRef<"subject" | "body">("body")
  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  function update(key: keyof EmailValues, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFeedback(null)
  }

  // Insert a tag at the cursor of whichever field was last focused, so the
  // admin never types [tags] by hand.
  function insertToken(token: string) {
    const field = activeFieldRef.current
    const el = field === "subject" ? subjectRef.current : bodyRef.current
    const key = field === "subject" ? "customerSubject" : "customerBody"
    const current = values[key]
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const next = current.slice(0, start) + token + current.slice(end)
    update(key, next)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy("save")
    setFeedback(null)
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error(await res.text())
      setFeedback({ type: "ok", text: "Saved successfully" })
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Save failed" })
    } finally {
      setBusy(null)
    }
  }

  async function handleSendTest() {
    setBusy("test")
    setFeedback(null)
    try {
      const res = await fetch("/api/admin/email-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = (await res.json()) as { ok?: boolean; to?: string; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to send test email")
      setFeedback({ type: "ok", text: `Test email sent to ${data.to}` })
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Failed to send test email" })
    } finally {
      setBusy(null)
    }
  }

  function handleReset() {
    setValues({ customerSubject: DEFAULT_CUSTOMER_SUBJECT, customerBody: DEFAULT_CUSTOMER_BODY })
    setFeedback(null)
  }

  const previewSubject = renderSubject(values.customerSubject, SAMPLE_EMAIL_VARS)
  const previewBody = renderEmailBody(values.customerBody, SAMPLE_EMAIL_VARS)
  const previewDoc = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;color:#0F1923;background:#ffffff;font-size:14px;line-height:1.55">${previewBody}</body></html>`

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-6 lg:grid-cols-2">
      {/* Editor column */}
      <div className="space-y-6">
        <div className="rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4">
          <label htmlFor="customerSubject" className="mb-1 block text-sm font-medium text-white">
            Subject line
          </label>
          <input
            id="customerSubject"
            ref={subjectRef}
            aria-label="Subject line"
            type="text"
            value={values.customerSubject}
            onFocus={() => { activeFieldRef.current = "subject" }}
            onChange={(e) => update("customerSubject", e.target.value)}
            className="w-full rounded border border-[rgba(255,255,255,0.12)] bg-[#0F1923] px-3 py-2 text-white focus:border-[#F59E0B] focus:outline-none"
          />
        </div>

        <div className="rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4">
          <p className="mb-2 text-sm font-medium text-white">Insert booking info</p>
          <p className="mb-3 text-xs text-[#94A3B8]">
            Click a tag to drop it where your cursor is. Each one is replaced with the customer&apos;s real
            details when the email is sent.
          </p>
          <div className="flex flex-wrap gap-2">
            {EMAIL_CHIPS.map((t) => (
              <button
                key={t.tag}
                type="button"
                title={t.tag}
                onClick={() => insertToken(t.tag)}
                className="rounded-full border border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.1)] px-3 py-1 text-xs font-medium text-[#F59E0B] hover:bg-[rgba(245,158,11,0.2)]"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4">
          <label htmlFor="customerBody" className="mb-1 block text-sm font-medium text-white">
            Email message
          </label>
          <p className="mb-3 text-xs text-[#94A3B8]">
            Write it like a normal email — just type your text. Leave a blank line between paragraphs. The
            preview on the right updates as you type.
          </p>
          <textarea
            id="customerBody"
            ref={bodyRef}
            aria-label="Email body"
            rows={18}
            value={values.customerBody}
            onFocus={() => { activeFieldRef.current = "body" }}
            onChange={(e) => update("customerBody", e.target.value)}
            className="w-full rounded border border-[rgba(255,255,255,0.12)] bg-[#0F1923] px-3 py-2 text-sm text-white focus:border-[#F59E0B] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy !== null}
            className="rounded bg-[#F59E0B] px-6 py-2 font-semibold text-[#0F1923] hover:bg-[#D97706] disabled:opacity-50"
          >
            {busy === "save" ? "Saving..." : "Save email"}
          </button>
          <button
            type="button"
            onClick={() => void handleSendTest()}
            disabled={busy !== null}
            className="rounded border border-[rgba(255,255,255,0.15)] px-6 py-2 font-semibold text-white hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-50"
          >
            {busy === "test" ? "Sending..." : "Send test email"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-[rgba(255,255,255,0.15)] px-6 py-2 font-semibold text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
          >
            Reset to default
          </button>
          {feedback && (
            <span className={`text-sm ${feedback.type === "ok" ? "text-green-400" : "text-red-400"}`}>
              {feedback.type === "ok" ? "✓ " : ""}
              {feedback.text}
            </span>
          )}
        </div>
      </div>

      {/* Live preview column */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733]">
          <div className="border-b border-[rgba(255,255,255,0.07)] px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-[#94A3B8]">Live preview (sample data)</p>
            <p className="mt-1 truncate text-sm font-medium text-white">{previewSubject}</p>
          </div>
          <iframe
            title="Email preview"
            srcDoc={previewDoc}
            sandbox=""
            className="h-[520px] w-full bg-white"
          />
        </div>
      </div>
    </form>
  )
}
