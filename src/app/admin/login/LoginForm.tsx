"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push(callbackUrl)
    } else {
      setError("Invalid email or password.")
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-[#94A3B8]">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-[rgba(255,255,255,0.12)] bg-[#1A2733] px-3 py-2 text-white placeholder:text-[#4A5568] focus:border-[#F59E0B] focus:outline-none"
          placeholder="admin@example.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[#94A3B8]">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-[rgba(255,255,255,0.12)] bg-[#1A2733] px-3 py-2 text-white placeholder:text-[#4A5568] focus:border-[#F59E0B] focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-[#F59E0B] px-4 py-2 font-semibold text-[#0F1923] hover:bg-[#D97706] disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  )
}
