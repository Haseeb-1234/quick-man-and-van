import { z } from "zod"

export const vanTypeSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])

export const addressLegSchema = z.object({
  addr: z.string().min(3).max(600),
  street: z.string().max(300).default(""),
  city: z.string().max(120).default(""),
  stairs: z.number().int().min(0).max(9),
  postcode: z.string().min(4).max(14),
  lat: z.number().nullable(),
  long: z.number().nullable(),
})

export const quoteRequestSchema = z.object({
  collection: addressLegSchema,
  stops: z.array(addressLegSchema).max(3),
  delivery: addressLegSchema,
  vantype: vanTypeSchema,
  hours: z.number().min(5).max(17.5),
  helpers: z.number().int().min(0).max(3),
  date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  submitter: z.string().max(50).optional(),
})

export const createBookingSchema = quoteRequestSchema.extend({
  clientname: z.string().min(2).max(120),
  clientemail: z.string().email(),
  clientphone: z.string().min(7).max(30),
  message: z.string().max(1000).optional(),
})

export const checkoutBodySchema = z.object({
  bookingId: z.string().min(10),
})
