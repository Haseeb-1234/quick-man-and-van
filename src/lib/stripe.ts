import Stripe from "stripe"

const secret = process.env.STRIPE_SECRET_KEY

export function getStripe(): Stripe | null {
  if (!secret) return null
  return new Stripe(secret, { typescript: true })
}
