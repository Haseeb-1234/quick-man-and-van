import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { ButtonLink } from "@/components/ui/Button"
import { SITE_NAME } from "@/lib/site"

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center bg-[#0F1923] px-4 py-24 text-center">
        <p className="text-sm font-semibold text-[#F59E0B]">404</p>
        <h1 className="mt-2 text-2xl font-bold text-[#F1F5F9]">Page not found</h1>
        <p className="mt-2 max-w-md text-[#94A3B8]">
          That URL doesn&apos;t exist on {SITE_NAME}. Check the link or start again from the home page.
        </p>
        <ButtonLink href="/" className="mt-8">
          Back to home
        </ButtonLink>
      </main>
      <Footer />
    </div>
  )
}
