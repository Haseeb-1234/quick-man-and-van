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
    <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.07)] bg-[#1A2733]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-[#F59E0B]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F59E0B] text-sm font-bold text-[#0F1923]">
            Q
          </span>
          <span className="hidden min-[380px]:inline">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#94A3B8] transition duration-150 hover:bg-[#223040] hover:text-[#F1F5F9]"
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
            className="text-sm font-semibold text-[#F59E0B] transition duration-150 hover:text-[#FBBF24]"
          >
            WhatsApp
          </a>
          <ButtonLink href="/move" variant="primary" className="btn-primary">
            Get free quotes
          </ButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.07)] text-[#F59E0B] transition duration-150 hover:bg-[#223040] md:hidden"
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
        <div id="mobile-nav" className="border-t border-[rgba(255,255,255,0.07)] bg-[#1A2733] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 text-base font-medium text-[#94A3B8] transition duration-150 hover:bg-[#223040] hover:text-[#F1F5F9]"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-3 text-base font-semibold text-[#F59E0B] transition duration-150 hover:bg-[#223040] hover:text-[#FBBF24]"
            >
              WhatsApp
            </a>
            <ButtonLink href="/move" className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
              Get free quotes
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
