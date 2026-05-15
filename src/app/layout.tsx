import type { Metadata, Viewport } from "next"
import "./globals.css"
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site"

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GB" className="h-full scroll-smooth">
      <body className="min-h-full bg-white font-sans text-zinc-900 antialiased">{children}</body>
    </html>
  )
}
