"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/email", label: "Email Template" },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r border-[rgba(255,255,255,0.07)] bg-[#111D27] px-4 py-6">
      <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-[#F59E0B]">Admin</p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
              pathname === link.href
                ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]"
                : "text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/admin/login" })}
        className="mt-auto rounded px-3 py-2 text-left text-sm text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
      >
        Sign out
      </button>
    </aside>
  )
}
