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
    <section className="border-t border-zinc-200 bg-zinc-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Services</h2>
        <p className="mt-3 max-w-2xl text-lg text-zinc-600">
          Man and van support for everyday moves — priced upfront so you can plan with confidence.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {services.map(({ title, body }) => (
            <li
              key={title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-[#3fb6ee]/40 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
