import { prisma } from "@/lib/prisma"
import { BookingStatus } from "@prisma/client"
import Link from "next/link"

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-400/10 text-yellow-400",
  CONFIRMED: "bg-green-400/10 text-green-400",
  COMPLETED: "bg-blue-400/10 text-blue-400",
  CANCELLED: "bg-red-400/10 text-red-400",
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusFilter = Object.values(BookingStatus).includes(status as BookingStatus)
    ? (status as BookingStatus)
    : undefined

  const bookings = await prisma.booking.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Bookings</h1>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[undefined, ...Object.values(BookingStatus)].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/bookings?status=${s}` : "/admin/bookings"}
            className={`rounded px-3 py-1 text-sm font-medium ${
              statusFilter === s
                ? "bg-[#F59E0B] text-[#0F1923]"
                : "bg-[#1A2733] text-[#94A3B8] hover:text-white"
            }`}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded border border-[rgba(255,255,255,0.07)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.07)] text-left text-xs uppercase tracking-wider text-[#94A3B8]">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Move date</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#94A3B8]">
                  No bookings found.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr
                key={b.id}
                className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.03)]"
              >
                <td className="px-4 py-3">
                  <Link href={`/admin/bookings/${b.id}`} className="font-mono text-[#F59E0B] hover:underline">
                    {b.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white">
                  <div>{b.contactName ?? "—"}</div>
                  <div className="text-xs text-[#94A3B8]">{b.contactEmail ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-[#94A3B8]">
                  {b.moveDate.toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-[#94A3B8]">
                  {b.collectionPostcode} → {b.deliveryPostcode}
                </td>
                <td className="px-4 py-3 font-semibold text-white">£{b.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#94A3B8]">
                  {b.createdAt.toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
