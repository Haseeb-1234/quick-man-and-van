import Link from "next/link"
import type { ComponentProps } from "react"

const variants = {
  primary:
    "bg-[#3fb6ee] text-white shadow-sm hover:bg-[#2fa8d9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3fb6ee]",
  secondary:
    "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
  outline:
    "border border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400",
} as const

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50"

type Variant = keyof typeof variants

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant
}

export function Button({ className = "", variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props} />
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant
}

export function ButtonLink({ className = "", variant = "primary", ...props }: ButtonLinkProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
}
