import { MoveWizard } from "@/components/quote/MoveWizard"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Instant Quotes",
  description: "Continue your instant man and van quote.",
}

function WizardFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-zinc-500 sm:px-6" aria-busy="true">
      Loading quote wizard...
    </div>
  )
}

export default async function MoveStagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params
  const numericStage = Number(stage)
  if (!Number.isInteger(numericStage) || numericStage < 1 || numericStage > 4) notFound()

  return (
    <Suspense fallback={<WizardFallback />}>
      <MoveWizard initialStep={numericStage} />
    </Suspense>
  )
}
