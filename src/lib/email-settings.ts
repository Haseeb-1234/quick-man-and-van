import { DEPOSIT_PERCENT, DEPOSIT_RATE, REMAINDER_PERCENT, REMAINDER_RATE } from "@/lib/payment-config"
import { DEFAULT_CUSTOMER_BODY, DEFAULT_CUSTOMER_SUBJECT, escapeHtml } from "@/lib/email-templates"
import { prisma } from "@/lib/prisma"
import type { Booking } from "@prisma/client"

export type EmailSettings = {
  customerSubject: string
  customerBody: string
}

/**
 * Returns the admin-configured confirmation email template, falling back to the
 * hardcoded defaults when no row exists or the DB is unreachable.
 */
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const row = await prisma.emailSettings.findUnique({ where: { id: "singleton" } })
    if (!row) return { customerSubject: DEFAULT_CUSTOMER_SUBJECT, customerBody: DEFAULT_CUSTOMER_BODY }
    return { customerSubject: row.customerSubject, customerBody: row.customerBody }
  } catch {
    return { customerSubject: DEFAULT_CUSTOMER_SUBJECT, customerBody: DEFAULT_CUSTOMER_BODY }
  }
}

/**
 * Builds the {{token}} substitution map for a booking. Plain values are
 * HTML-escaped; {{stopsList}} and {{depositReminder}} are pre-rendered HTML
 * fragments because they involve a variable-length list / conditional content a
 * flat token replacer cannot express.
 */
/** Format a move date for the customer, in UK time, e.g. "Wednesday, 15 July 2026 at 10:00". */
function formatMoveDate(d: Date): string {
  const datePart = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(d)
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(d)
  return `${datePart} at ${timePart}`
}

export function buildEmailVars(booking: Booking): Record<string, string> {
  const short = booking.id.slice(0, 8).toUpperCase()
  const isDeposit = booking.paymentType === "DEPOSIT"
  const depositAmount = (booking.price * DEPOSIT_RATE).toFixed(2)
  const remainingAmount = (booking.price * REMAINDER_RATE).toFixed(2)

  const paymentLine = isDeposit
    ? `£${depositAmount} (${DEPOSIT_PERCENT}% deposit paid — £${remainingAmount} remaining, payable by cash or bank transfer after the job)`
    : `£${booking.price.toFixed(2)} (paid in full)`

  const depositReminder = isDeposit
    ? `<p><strong>Reminder:</strong> The remaining ${REMAINDER_PERCENT}% (£${remainingAmount}) is due to the driver by cash or bank transfer after the job is complete.</p>`
    : ""

  const stopsList =
    booking.stops && Array.isArray(booking.stops)
      ? (booking.stops as { line?: string; postcode?: string }[])
          .map(
            (s, i) =>
              `<li>Stop ${i + 1}: ${escapeHtml(String(s.line ?? ""))} (${escapeHtml(String(s.postcode ?? ""))})</li>`,
          )
          .join("")
      : ""

  return {
    name: booking.contactName ? escapeHtml(booking.contactName) : "",
    bookingRef: short,
    collectAddress: escapeHtml(booking.collectionAddress),
    collectPostcode: escapeHtml(booking.collectionPostcode),
    collectStairs: String(booking.collectionStairs),
    deliverAddress: escapeHtml(booking.deliveryAddress),
    deliverPostcode: escapeHtml(booking.deliveryPostcode),
    deliverStairs: String(booking.deliveryStairs),
    stopsList,
    moveDate: escapeHtml(formatMoveDate(booking.moveDate)),
    vanSize: escapeHtml(booking.vanSize),
    helpers: String(booking.helpers),
    paymentLine,
    depositReminder,
  }
}
