"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect, useLayoutEffect, type ReactNode } from "react"

// useLayoutEffect blocks paint; useEffect is a no-op on the server — safe isomorphic pattern.
const useSafeLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

function ThemeSync() {
  useSafeLayoutEffect(() => {
    try {
      const t = localStorage.getItem("theme")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (t === "dark" || (!t && prefersDark)) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } catch {}
  }, [])
  return null
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeSync />
      {children}
    </SessionProvider>
  )
}
