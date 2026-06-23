import { Resend } from "resend"

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export function bookingFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Laxami Man and Van <info@laxamigroupsltd.com>"
}

export function adminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "sibtainsafdar47@gmail.com"
}
