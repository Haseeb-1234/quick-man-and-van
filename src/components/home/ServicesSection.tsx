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
    body: "Compact vans and flexible timing when you don't need a full removals crew.",
  },
  {
    title: "Office relocations",
    body: "Desks, chairs, and equipment moved with minimal downtime (customer booking side).",
  },
] as const

export function ServicesSection() {
  return (
    <section className="border-t border-[var(--border)] bg-page py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-primary">Services</h2>
        <p className="mt-3 max-w-2xl text-lg text-secondary">
          Man and van support for everyday moves — priced upfront so you can plan with confidence.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {services.map(({ title, body }) => (
            <li
              key={title}
              className="rounded-2xl border border-[var(--border)] bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition duration-200 hover:border-accent/40"
            >
              <h3 className="text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
