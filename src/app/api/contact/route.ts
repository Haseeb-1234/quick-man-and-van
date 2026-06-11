import { rejectOversizedJsonRequest } from "@/lib/api-security"
import { adminEmail, bookingFromEmail, getResend } from "@/lib/resend"
import { NextResponse } from "next/server"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
})

export async function POST(req: Request) {
  const sizeError = rejectOversizedJsonRequest(req)
  if (sizeError) return sizeError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, phone, message } = parsed.data

  const resend = getResend()
  if (resend) {
    await resend.emails.send({
      from: bookingFromEmail(),
      to: adminEmail(),
      replyTo: email,
      subject: `Contact form: ${name}`,
      html: `
        <h2>New contact message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${message}</p>
      `,
    })
  }

  return NextResponse.json({ ok: true })
}
