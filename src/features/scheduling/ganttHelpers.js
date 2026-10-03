import { isWorkingDay, workingDateAtIndex } from "./engine/calendar"

export const WEEK_WIDTHS = [56, 88, 140]

export function ganttScale(duration, baseline, daysPerWeek, weekPx = 88) {
  const weeks = Math.max(
    2,
    Math.ceil(
      Math.max(duration, baseline?.projectDurationDays ?? 0, 1) / daysPerWeek,
    ) + 1,
  )
  return { weeks, totalDays: weeks * daysPerWeek, width: weeks * weekPx }
}

export function scheduleDate(startDate, index, calendar) {
  if (
    !startDate ||
    !calendar ||
    !Object.values(calendar.workingWeek).some(Boolean)
  )
    return null
  return workingDateAtIndex(
    startDate.slice(0, 10),
    Math.max(0, index),
    calendar,
  )
}

export function activityCode(node) {
  return (
    node?.wbsCode ||
    (/^[A-Z](?:\.[\w-]+)*$/.test(node?.id || "") ? node.id : "")
  )
}

export function activityLabel(node) {
  if (!node) return "Missing activity"
  const code = activityCode(node)
  return code && !node.name.startsWith(code)
    ? `${code} ${node.name}`
    : node.name
}

/** Working days between the project start and `todayIso` (fractional position on the working-day axis). */
export function workingDaysElapsed(startDate, calendar, todayIso) {
  if (!startDate || !calendar) return null
  const start = startDate.slice(0, 10)
  if (todayIso < start) return null
  const cursor = new Date(`${start}T00:00:00Z`)
  const end = new Date(`${todayIso}T00:00:00Z`)
  let days = 0
  while (cursor < end && days < 5000) {
    if (isWorkingDay(cursor.toISOString().slice(0, 10), calendar)) days += 1
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}
