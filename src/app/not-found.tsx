import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { ButtonLink } from "@/components/ui/Button"
import { SITE_NAME } from "@/lib/site"

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-24 text-center">
        <p className="text-sm font-semibold text-[#3fb6ee]">404</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Page not found</h1>
        <p className="mt-2 max-w-md text-zinc-600">
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
