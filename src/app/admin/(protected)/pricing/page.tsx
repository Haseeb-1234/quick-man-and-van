import { getPricingConfig } from "@/lib/pricing"
import PricingForm from "./PricingForm"

export default async function AdminPricingPage() {
  const config = await getPricingConfig()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Pricing Settings</h1>
      <p className="mb-8 text-sm text-[#94A3B8]">
        Changes apply immediately to all new quotes. Existing bookings already paid are not affected.
      </p>
      <PricingForm initialValues={config} />
    </div>
  )
}
