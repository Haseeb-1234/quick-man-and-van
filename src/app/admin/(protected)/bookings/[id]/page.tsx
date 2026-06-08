import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import BookingActions from "./BookingActions"

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) notFound()

  const rows: { label: string; value: string | number | null }[] = [
    { label: "Booking ID", value: booking.id },
    { label: "Status", value: booking.status },
    { label: "Customer name", value: booking.contactName },
    { label: "Customer email", value: booking.contactEmail },
    { label: "Customer phone", value: booking.contactPhone },
    { label: "Collection address", value: `${booking.collectionAddress} (${booking.collectionPostcode})` },
    { label: "Collection stairs", value: booking.collectionStairs },
    { label: "Delivery address", value: `${booking.deliveryAddress} (${booking.deliveryPostcode})` },
    { label: "Delivery stairs", value: booking.deliveryStairs },
    { label: "Move date", value: booking.moveDate.toLocaleString("en-GB") },
    { label: "Van size", value: booking.vanSize },
    { label: "Helpers", value: booking.helpers },
    { label: "Hours booked", value: booking.bookedHours },
    { label: "Price paid", value: booking.price ? `£${booking.price.toFixed(2)}` : null },
    { label: "Stripe session ID", value: booking.stripeSessionId },
    { label: "Stripe payment ID", value: booking.stripePaymentId },
    { label: "Created", value: booking.createdAt.toLocaleString("en-GB") },
    { label: "Updated", value: booking.updatedAt.toLocaleString("en-GB") },
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/bookings" className="text-sm text-[#94A3B8] hover:text-white">← All bookings</Link>
        <h1 className="text-2xl font-bold text-white">
          Booking {booking.id.slice(0, 8).toUpperCase()}
        </h1>
      </div>

      <div className="mb-8 rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex border-b border-[rgba(255,255,255,0.04)] px-4 py-3 last:border-0"
          >
            <span className="w-48 flex-shrink-0 text-sm text-[#94A3B8]">{row.label}</span>
            <span className="text-sm text-white break-all">{row.value ?? "—"}</span>
          </div>
        ))}
      </div>

      <BookingActions booking={{ id: booking.id, status: booking.status, contactName: booking.contactName, contactEmail: booking.contactEmail, contactPhone: booking.contactPhone }} />
    </div>
  )
}
