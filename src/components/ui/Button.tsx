import Link from "next/link"
import type { ComponentProps } from "react"

const variants = {
  primary:
    "bg-[#F59E0B] text-[#0F1923] shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:bg-[#FBBF24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B]",
  secondary:
    "bg-transparent text-[#F59E0B] shadow-sm ring-1 ring-[#F59E0B] hover:bg-[rgba(245,158,11,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B]",
  outline:
    "border border-[#F59E0B] bg-transparent text-[#F59E0B] hover:bg-[rgba(245,158,11,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F59E0B]",
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
