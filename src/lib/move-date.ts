/** Parse DD/MM/YYYY + HH:MM into a UTC Date. Safe for both client and server. */
export function parseMoveDateTime(date: string, time: string): Date {
  const [day, month, year] = date.split("/").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour ?? 0, minute ?? 0, 0))
}
