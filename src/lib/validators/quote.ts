import { z } from "zod"

export const COORDS_REQUIRED_MESSAGE = "Valid address with coordinates required."

export const vanTypeSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])

function legHasValidCoords(leg: { lat: unknown; long: unknown }): boolean {
  return (
    typeof leg.lat === "number" &&
    Number.isFinite(leg.lat) &&
    typeof leg.long === "number" &&
    Number.isFinite(leg.long)
  )
}

const addressLegBaseSchema = z.object({
  addr: z.string().min(3).max(600),
  street: z.string().max(300).default(""),
  city: z.string().max(120).default(""),
  stairs: z.number().int().min(0).max(9),
  postcode: z.string().max(14),
  lat: z.number().finite(),
  long: z.number().finite(),
})

/** Collection, delivery, and populated stops must include finite coordinates. */
export const addressLegSchema = addressLegBaseSchema.refine(legHasValidCoords, {
  message: COORDS_REQUIRED_MESSAGE,
})

/** Stops with a non-empty address must include coordinates; blank placeholder rows are allowed. */
export const stopLegSchema = z
  .object({
    addr: z.string().max(600),
    street: z.string().max(300).default(""),
    city: z.string().max(120).default(""),
    stairs: z.number().int().min(0).max(9),
    postcode: z.string().max(14),
    lat: z.number().nullable(),
    long: z.number().nullable(),
  })
  .refine((leg) => leg.addr.trim().length < 3 || legHasValidCoords(leg), {
    message: COORDS_REQUIRED_MESSAGE,
  })

export const quoteRequestSchema = z.object({
  collection: addressLegSchema,
  stops: z.array(stopLegSchema).max(3),
  delivery: addressLegSchema,
  vantype: vanTypeSchema,
  hours: z.number().min(5).max(17.5),
  helpers: z.number().int().min(0).max(3),
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/)
    .refine((d) => {
      const [day, month, year] = d.split("/").map(Number)
      if (!day || !month || !year) return false
      const parsed = new Date(Date.UTC(year, month - 1, day))
      // Verify components round-trip (catches dates like 31/02)
      if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
      ) {
        return false
      }
      const todayUtc = new Date()
      todayUtc.setUTCHours(0, 0, 0, 0)
      return parsed >= todayUtc
    }, "Move date must be a valid date and cannot be in the past"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .refine((t) => {
      const [h, m] = t.split(":").map(Number)
      return h >= 0 && h <= 23 && m >= 0 && m <= 59
    }, "Invalid time"),
  submitter: z.enum(["submit", "widget", "partner"]).optional(),
})

export const createBookingSchema = quoteRequestSchema.extend({
  clientname: z.string().min(2).max(120),
  clientemail: z.email(),
  clientphone: z.string().min(7).max(30),
  message: z.string().max(1000).optional(),
  selectedQuoteId: z.string().max(50).optional(),
})

export const checkoutBodySchema = z.object({
  bookingId: z.string().min(10),
  checkoutToken: z.uuid(),
})

export function hasCoordsValidationError(error: z.ZodError): boolean {
  return error.issues.some((issue) => issue.message === COORDS_REQUIRED_MESSAGE)
}
