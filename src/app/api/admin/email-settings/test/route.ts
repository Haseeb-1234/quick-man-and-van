import { authOptions } from "@/lib/auth"
import { renderEmailBody, renderSubject, SAMPLE_EMAIL_VARS } from "@/lib/email-templates"
import { adminEmail, bookingFromEmail, getResend } from "@/lib/resend"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  customerSubject: z.string().min(1).max(200),
  customerBody: z.string().min(1).max(20000),
})

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session != null
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const resend = getResend()
  if (!resend) return NextResponse.json({ error: "email_not_configured" }, { status: 503 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error", issues: parsed.error.flatten() }, { status: 400 })

  const to = adminEmail()
  const subject = `[TEST] ${renderSubject(parsed.data.customerSubject, SAMPLE_EMAIL_VARS)}`
  const html = renderEmailBody(parsed.data.customerBody, SAMPLE_EMAIL_VARS)

  try {
    await resend.emails.send({ from: bookingFromEmail(), to, subject, html })
    return NextResponse.json({ ok: true, to })
  } catch (e) {
    console.error("Test email error", e)
    return NextResponse.json({ error: "send_failed" }, { status: 500 })
  }
}
