import { workingDateAtIndex } from "./engine/calendar"

export function ganttScale(duration, baseline, daysPerWeek) {
  const weeks = Math.max(
    2,
    Math.ceil(
      Math.max(duration, baseline?.projectDurationDays ?? 0, 1) / daysPerWeek,
    ) + 1,
  )
  return { weeks, totalDays: weeks * daysPerWeek, width: weeks * 88 }
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
