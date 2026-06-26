import { getEmailSettings } from "@/lib/email-settings"
import EmailTemplateForm from "./EmailTemplateForm"

export default async function AdminEmailPage() {
  const settings = await getEmailSettings()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Confirmation Email</h1>
      <p className="mb-8 text-sm text-[#94A3B8]">
        Edit the email customers receive after they pay. Change the wording however you like and watch the
        live preview update as you type. Use the <span className="text-[#F59E0B]">Insert booking info</span>{" "}
        tags for anything specific to each customer (their name, addresses, price) — those are filled in
        automatically when the email is sent. Send a test to yourself before saving.
      </p>
      <EmailTemplateForm initialValues={settings} />
    </div>
  )
}
