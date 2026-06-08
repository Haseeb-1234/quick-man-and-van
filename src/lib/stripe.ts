import Stripe from "stripe"

export function getStripe(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  return new Stripe(secret, { typescript: true })
}
