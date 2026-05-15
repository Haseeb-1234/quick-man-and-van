"use client"

import Link from "next/link"
import { useState } from "react"
import { ButtonLink } from "@/components/ui/Button"
import { SITE_NAME, WHATSAPP_URL } from "@/lib/site"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/move", label: "Get quotes" },
  { href: "/contact", label: "Contact" },
] as const

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-zinc-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3fb6ee] text-sm font-bold text-white">
            Q
          </span>
          <span className="hidden min-[380px]:inline">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#3fb6ee] hover:underline"
          >
            WhatsApp
          </a>
          <ButtonLink href="/move" variant="primary">
            Get free quotes
          </ButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 text-base font-medium text-zinc-800 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-3 text-base font-medium text-[#3fb6ee]"
            >
              WhatsApp
            </a>
            <ButtonLink href="/move" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Get free quotes
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
