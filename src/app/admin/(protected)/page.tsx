import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
  const [total, pending, confirmed, completed, cancelled] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
  ])

  const stats = [
    { label: "Total bookings", value: total },
    { label: "Pending", value: pending, color: "text-yellow-400" },
    { label: "Confirmed", value: confirmed, color: "text-green-400" },
    { label: "Completed", value: completed, color: "text-blue-400" },
    { label: "Cancelled", value: cancelled, color: "text-red-400" },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-4">
            <p className="text-xs text-[#94A3B8]">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color ?? "text-white"}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
