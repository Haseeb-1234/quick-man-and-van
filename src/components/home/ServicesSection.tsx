const services = [
  {
    title: "Home moves",
    body: "Flats, houses, and shared moves — we handle careful loading and unloading.",
  },
  {
    title: "Single items & deliveries",
    body: "Furniture, appliances, and marketplace purchases delivered door to door.",
  },
  {
    title: "Student & small moves",
    body: "Compact vans and flexible timing when you don’t need a full removals crew.",
  },
  {
    title: "Office relocations",
    body: "Desks, chairs, and equipment moved with minimal downtime (customer booking side).",
  },
] as const

export function ServicesSection() {
  return (
    <section className="border-t border-[rgba(255,255,255,0.07)] bg-[#0F1923] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9]">Services</h2>
        <p className="mt-3 max-w-2xl text-lg text-[#94A3B8]">
          Man and van support for everyday moves — priced upfront so you can plan with confidence.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {services.map(({ title, body }) => (
            <li
              key={title}
              className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#1A2733] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition duration-200 hover:border-[rgba(245,158,11,0.4)] hover:bg-[#1E2F3D]"
            >
              <h3 className="text-lg font-semibold text-[#F1F5F9]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
