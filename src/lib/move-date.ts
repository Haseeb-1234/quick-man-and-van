/** Parse DD/MM/YYYY + HH:MM into a local Date. Treats the time as the user's local timezone. */
export function parseMoveDateTime(date: string, time: string): Date {
  const [day, month, year] = date.split("/").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hour ?? 0, minute ?? 0, 0)
}
