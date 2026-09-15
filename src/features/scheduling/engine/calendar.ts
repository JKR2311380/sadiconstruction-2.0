import type { CalendarInput, Weekday } from "./types"

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

function weekdayOf(date: Date): Weekday {
  return WEEKDAYS[date.getUTCDay()]
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function formatIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function exceptionType(
  calendar: CalendarInput,
  iso: string,
): "holiday" | "extra_work" | undefined {
  return calendar.exceptions.find((row) => row.date === iso)?.type
}

export function isWorkingDay(iso: string, calendar: CalendarInput): boolean {
  const extra = exceptionType(calendar, iso)
  if (extra === "holiday") return false
  if (extra === "extra_work") return true
  return calendar.workingWeek[weekdayOf(parseIso(iso))]
}

export function addWorkingDays(
  startIso: string,
  days: number,
  calendar: CalendarInput,
): string {
  if (days <= 0) return startIso
  let remaining = days
  const cursor = parseIso(startIso)
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    if (isWorkingDay(formatIso(cursor), calendar)) remaining -= 1
  }
  return formatIso(cursor)
}

export function workingDateAtIndex(
  projectStartIso: string,
  index: number,
  calendar: CalendarInput,
): string {
  let iso = projectStartIso
  while (!isWorkingDay(iso, calendar)) {
    const next = parseIso(iso)
    next.setUTCDate(next.getUTCDate() + 1)
    iso = formatIso(next)
  }
  if (index <= 0) return iso
  return addWorkingDays(iso, index, calendar)
}
