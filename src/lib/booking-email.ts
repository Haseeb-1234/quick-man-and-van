import { DEPOSIT_PERCENT, DEPOSIT_RATE, REMAINDER_PERCENT, REMAINDER_RATE } from "@/lib/payment-config"
import { adminEmail, bookingFromEmail, getResend } from "@/lib/resend"
import type { Booking } from "@prisma/client"

export async function sendBookingConfirmationEmail(booking: Booking): Promise<boolean> {
  const resend = getResend()
  if (!resend || !booking.contactEmail) return false

  const short = booking.id.slice(0, 8).toUpperCase()
  const isDeposit = booking.paymentType === "DEPOSIT"
  const depositAmount = (booking.price * DEPOSIT_RATE).toFixed(2)
  const remainingAmount = (booking.price * REMAINDER_RATE).toFixed(2)
  const paidLabel = isDeposit
    ? `£${depositAmount} (${DEPOSIT_PERCENT}% deposit paid — £${remainingAmount} remaining, payable by cash or bank transfer after the job)`
    : `£${booking.price.toFixed(2)} (paid in full)`

  const stops =
    booking.stops && Array.isArray(booking.stops)
      ? (booking.stops as { line?: string; postcode?: string }[])
          .map((s, i) => `<li>Stop ${i + 1}: ${escapeHtml(String(s.line ?? ""))} (${escapeHtml(String(s.postcode ?? ""))})</li>`)
          .join("")
      : ""

  const customerHtml = `
    <h1>Booking confirmed</h1>
    <p>Hi${booking.contactName ? ` ${escapeHtml(booking.contactName)}` : ""},</p>
    <p>Thanks for booking with Laxami Man and Van. Your reference is <strong>${short}</strong>.</p>
    <ul>
      <li><strong>Collect:</strong> ${escapeHtml(booking.collectionAddress)} (${escapeHtml(booking.collectionPostcode)}) — stairs: ${booking.collectionStairs}</li>
      ${stops}
      <li><strong>Deliver:</strong> ${escapeHtml(booking.deliveryAddress)} (${escapeHtml(booking.deliveryPostcode)}) — stairs: ${booking.deliveryStairs}</li>
      <li><strong>Move date:</strong> ${escapeHtml(booking.moveDate.toISOString())}</li>
      <li><strong>Van:</strong> ${escapeHtml(booking.vanSize)} — helpers: ${booking.helpers}</li>
      <li><strong>Payment:</strong> ${paidLabel}</li>
    </ul>
    ${isDeposit ? `<p><strong>Reminder:</strong> The remaining ${REMAINDER_PERCENT}% (£${remainingAmount}) is due to the driver by cash or bank transfer after the job is complete.</p>` : ""}
    <p>If anything looks wrong, reply to this email or WhatsApp us from the website.</p>
  `

  const adminHtml = `
    <h1>New booking received — ${short}</h1>
    <ul>
      <li><strong>Customer:</strong> ${escapeHtml(booking.contactName ?? "N/A")}</li>
      <li><strong>Email:</strong> ${escapeHtml(booking.contactEmail)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(booking.contactPhone ?? "N/A")}</li>
      <li><strong>Collect:</strong> ${escapeHtml(booking.collectionAddress)} (${escapeHtml(booking.collectionPostcode)}) — stairs: ${booking.collectionStairs}</li>
      ${stops}
      <li><strong>Deliver:</strong> ${escapeHtml(booking.deliveryAddress)} (${escapeHtml(booking.deliveryPostcode)}) — stairs: ${booking.deliveryStairs}</li>
      <li><strong>Move date:</strong> ${escapeHtml(booking.moveDate.toISOString())}</li>
      <li><strong>Van:</strong> ${escapeHtml(booking.vanSize)} — helpers: ${booking.helpers}</li>
      <li><strong>Payment type:</strong> ${booking.paymentType}</li>
      <li><strong>Amount charged:</strong> £${isDeposit ? depositAmount : booking.price.toFixed(2)}${isDeposit ? ` (${DEPOSIT_PERCENT}% deposit — £${remainingAmount} outstanding)` : " (full)"}</li>
      <li><strong>Booking ID:</strong> ${booking.id}</li>
    </ul>
  `

  const from = bookingFromEmail()

  try {
    await Promise.all([
      resend.emails.send({
        from,
        to: booking.contactEmail,
        subject: `Your move is confirmed — ${short}`,
        html: customerHtml,
      }),
      resend.emails.send({
        from,
        to: adminEmail(),
        subject: `New booking — ${short} (£${booking.price.toFixed(2)})`,
        html: adminHtml,
      }),
    ])
    return true
  } catch (e) {
    console.error("Resend error", e)
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;")
}
