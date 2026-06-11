import Link from "next/link"
import type { ComponentProps } from "react"

const variants = {
  primary:
    "bg-accent text-white shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  secondary:
    "bg-transparent text-accent shadow-sm ring-1 ring-accent hover:bg-accent/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  outline:
    "border border-accent bg-transparent text-accent hover:bg-accent/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
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
