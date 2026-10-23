export { cn } from "cn"

/** Today's date as YYYY-MM-DD in the browser's time zone (toISOString would give the UTC day). */
export function todayIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

export const MAX_DAYS = 3650

/** Whole working days within [min, max]; anything unreadable becomes 0. */
export function clampDays(value, min = 0, max = MAX_DAYS) {
  const days = Math.round(Number(value))
  return Math.min(max, Math.max(min, Number.isFinite(days) ? days : 0))
}
