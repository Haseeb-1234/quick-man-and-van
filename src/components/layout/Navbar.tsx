"use client"

import Link from "next/link"
import { useState } from "react"
import { ButtonLink } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { SITE_NAME, WHATSAPP_URL } from "@/lib/site"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/move", label: "Get quotes" },
  { href: "/contact", label: "Contact" },
] as const

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-accent">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            Q
          </span>
          <span className="hidden min-[380px]:inline">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition duration-150 hover:bg-hover-bg hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-accent transition duration-150 hover:text-accent-hover"
          >
            WhatsApp
          </a>
          <ButtonLink href="/move" variant="primary" className="btn-primary">
            Get free quotes
          </ButtonLink>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--border)] text-accent transition duration-150 hover:bg-hover-bg"
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
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-[var(--border)] bg-surface p-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg p-3 text-base font-medium text-secondary transition duration-150 hover:bg-hover-bg hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-3 text-base font-semibold text-accent transition duration-150 hover:bg-hover-bg hover:text-accent-hover"
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
