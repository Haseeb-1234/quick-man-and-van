import { MoveWizard } from "@/components/quote/MoveWizard"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Get quotes",
  description: "Start your instant man and van quote — addresses, stops, date, and pricing.",
}

function WizardFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500 sm:px-6" aria-busy="true">
      Loading quote wizard…
    </div>
  )
}

export default function MovePage() {
  return (
    <Suspense fallback={<WizardFallback />}>
      <MoveWizard />
    </Suspense>
  )
}
