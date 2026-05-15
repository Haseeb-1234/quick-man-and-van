import { bookingFromEmail, getResend } from "@/lib/resend"
import type { Booking } from "@prisma/client"

export async function sendBookingConfirmationEmail(booking: Booking): Promise<boolean> {
  const resend = getResend()
  if (!resend || !booking.contactEmail) return false

  const to = booking.contactEmail
  const short = booking.id.slice(0, 8).toUpperCase()

  const stops =
    booking.stops && Array.isArray(booking.stops)
      ? (booking.stops as { line?: string; postcode?: string }[])
          .map((s, i) => `<li>Stop ${i + 1}: ${s.line ?? ""} (${s.postcode ?? ""})</li>`)
          .join("")
      : ""

  const html = `
    <h1>Booking confirmed</h1>
    <p>Hi${booking.contactName ? ` ${escapeHtml(booking.contactName)}` : ""},</p>
    <p>Thanks for booking with Quick Man and Van. Your reference is <strong>${short}</strong>.</p>
    <ul>
      <li><strong>Collect:</strong> ${escapeHtml(booking.collectionAddress)} (${escapeHtml(booking.collectionPostcode)}) — stairs: ${booking.collectionStairs}</li>
      ${stops}
      <li><strong>Deliver:</strong> ${escapeHtml(booking.deliveryAddress)} (${escapeHtml(booking.deliveryPostcode)}) — stairs: ${booking.deliveryStairs}</li>
      <li><strong>Move date:</strong> ${escapeHtml(booking.moveDate.toISOString())}</li>
      <li><strong>Van:</strong> ${escapeHtml(booking.vanSize)} — helpers: ${booking.helpers}</li>
      <li><strong>Total paid:</strong> £${booking.price.toFixed(2)}</li>
    </ul>
    <p>If anything looks wrong, reply to this email or WhatsApp us from the website.</p>
  `

  try {
    await resend.emails.send({
      from: bookingFromEmail(),
      to,
      subject: `Your move is confirmed — ${short}`,
      html,
    })
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
}
