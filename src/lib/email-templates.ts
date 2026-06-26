/**
 * Pure, client-safe email template helpers. No server-only imports (no Prisma,
 * no Resend) so this module can be imported into client components (the admin
 * editor's live preview and chips) as well as server code.
 *
 * The admin authors the confirmation email as PLAIN TEXT with friendly
 * [Plain English] tags — never raw HTML. On send/preview we:
 *   1. HTML-escape the admin's literal text,
 *   2. turn blank lines into paragraphs and bare URLs into links,
 *   3. swap inline tags (e.g. [Customer name]) for the real, already-escaped value,
 *   4. swap the [Booking details] tag for an auto-formatted details block
 *      (collect / stops / deliver / date / van / payment / deposit reminder).
 */

/** The special tag that expands to the auto-formatted booking details block. */
const DETAILS_TAG = "[Booking details]"

/** Default subject line. Uses the same [tags] as the body. */
export const DEFAULT_CUSTOMER_SUBJECT = "Your move is confirmed — [Booking reference]"

/** Default plain-text body for the customer confirmation email. */
export const DEFAULT_CUSTOMER_BODY = `Hi [Customer name],

Thanks for booking with Laxami Man and Van. Your reference is [Booking reference].

[Booking details]

If anything looks wrong, just reply to this email or WhatsApp us from the website.`

/**
 * Inline tags the admin can drop into the subject or message. Each maps to a key
 * in the vars produced by buildEmailVars / SAMPLE_EMAIL_VARS. Drives the editor
 * chips so the admin never types tags by hand.
 */
const EMAIL_INLINE_TAGS: { tag: string; key: string; label: string }[] = [
  { tag: "[Customer name]", key: "name", label: "Customer name" },
  { tag: "[Booking reference]", key: "bookingRef", label: "Booking reference" },
  { tag: "[Move date]", key: "moveDate", label: "Move date" },
  { tag: "[Van size]", key: "vanSize", label: "Van size" },
  { tag: "[Helpers]", key: "helpers", label: "Helpers" },
  { tag: "[Collection address]", key: "collectAddress", label: "Collection address" },
  { tag: "[Delivery address]", key: "deliverAddress", label: "Delivery address" },
  { tag: "[Payment summary]", key: "paymentLine", label: "Payment summary" },
]

/** Chips shown in the editor: the inline tags plus the details block. */
export const EMAIL_CHIPS: { tag: string; label: string }[] = [
  ...EMAIL_INLINE_TAGS.map(({ tag, label }) => ({ tag, label })),
  { tag: DETAILS_TAG, label: "Booking details (full list)" },
]

/** Escape user-supplied values before they are placed into email HTML. */
export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;")
}

/** Wrap bare http(s) URLs in anchor tags. Runs on already-escaped text. */
function linkify(text: string): string {
  return text.replace(/(https?:\/\/[^\s<[]+)/g, '<a href="$1">$1</a>')
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Replace all known [tags] in a single pass so inserted values are never
 * re-scanned — prevents one booking field's value being interpreted as another
 * tag (field confusion).
 */
function applyTags(text: string, replacements: Record<string, string>): string {
  const tags = Object.keys(replacements)
  if (tags.length === 0) return text
  const re = new RegExp(tags.map(escapeRegExp).join("|"), "g")
  return text.replace(re, (m) => replacements[m] ?? m)
}

/** Map of inline [tag] -> value for the tags present in `vars`. */
function inlineReplacements(vars: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const { tag, key } of EMAIL_INLINE_TAGS) {
    if (vars[key] !== undefined) map[tag] = vars[key]
  }
  return map
}

/**
 * Build the auto-formatted booking details block from the vars map. Values are
 * already HTML-escaped by buildEmailVars; stopsList/depositReminder are
 * pre-rendered HTML fragments (empty when not applicable).
 */
function buildDetailsBlock(vars: Record<string, string>): string {
  const stops = vars.stopsList ? `\n  ${vars.stopsList}` : ""
  const reminder = vars.depositReminder ? `\n${vars.depositReminder}` : ""
  return `<ul>
  <li><strong>Collect:</strong> ${vars.collectAddress} (${vars.collectPostcode}) — stairs: ${vars.collectStairs}</li>${stops}
  <li><strong>Deliver:</strong> ${vars.deliverAddress} (${vars.deliverPostcode}) — stairs: ${vars.deliverStairs}</li>
  <li><strong>Move date:</strong> ${vars.moveDate}</li>
  <li><strong>Van:</strong> ${vars.vanSize} — helpers: ${vars.helpers}</li>
  <li><strong>Payment:</strong> ${vars.paymentLine}</li>
</ul>${reminder}`
}

/** Render the subject line: plain text with inline [tags] substituted. */
export function renderSubject(subject: string, vars: Record<string, string>): string {
  return applyTags(subject, inlineReplacements(vars))
}

/**
 * Render the plain-text body into HTML: paragraphs from blank lines, links from
 * URLs, inline [tags] and the [Booking details] block substituted. If the
 * details tag is absent, the block is appended at the end so customers never
 * lose their booking details.
 */
export function renderEmailBody(plainBody: string, vars: Record<string, string>): string {
  const details = buildDetailsBlock(vars)
  const bodyMap = { ...inlineReplacements(vars), [DETAILS_TAG]: details }
  let hadDetails = false

  const blocks = plainBody.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/)
  const rendered = blocks
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      // Standalone details tag: emit the block directly (avoid wrapping a <ul> in <p>).
      if (block === DETAILS_TAG) {
        hadDetails = true
        return details
      }
      if (block.includes(DETAILS_TAG)) hadDetails = true
      let safe = escapeHtml(block).replace(/\n/g, "<br>")
      safe = linkify(safe)
      safe = applyTags(safe, bodyMap)
      return `<p>${safe}</p>`
    })

  let html = rendered.join("\n")
  if (!hadDetails) html += `\n${details}`
  return html
}

/**
 * Sample values used by the admin live preview and "Send test email". Keep every
 * key from buildEmailVars represented so previews render fully. Models a typical
 * full-payment booking with one extra stop.
 */
export const SAMPLE_EMAIL_VARS: Record<string, string> = {
  name: "Jane Smith",
  bookingRef: "AB12CD34",
  collectAddress: "12 Example Street, London",
  collectPostcode: "E1 6AN",
  collectStairs: "1",
  deliverAddress: "98 Sample Road, London",
  deliverPostcode: "SW1A 1AA",
  deliverStairs: "2",
  stopsList: "<li>Stop 1: 50 Midway Lane, London (N1 9GU)</li>",
  moveDate: "Wednesday, 15 July 2026 at 10:00",
  vanSize: "Large van",
  helpers: "2",
  paymentLine: "£210.00 (paid in full)",
  depositReminder: "",
}
