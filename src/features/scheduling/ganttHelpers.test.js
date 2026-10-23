import { describe, expect, it } from "vitest"
import { workingDateAtIndex } from "./engine/calendar"
import { weekStartDates } from "./ganttHelpers"

const calendar = {
  workingWeek: { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true },
  exceptions: [{ date: "2026-01-01", type: "holiday" }],
}

describe("weekStartDates", () => {
  it("matches the per-index walk for every week", () => {
    const dates = weekStartDates("2025-12-28", 12, 6, calendar)
    expect(dates).toHaveLength(12)
    dates.forEach((date, i) => {
      expect(date).toBe(workingDateAtIndex("2025-12-28", i * 6, calendar))
    })
  })

  it("returns nulls when the project has no start date", () => {
    expect(weekStartDates(null, 3, 6, calendar)).toEqual([null, null, null])
  })

  it("stays linear for a very long schedule", () => {
    const started = performance.now()
    const dates = weekStartDates("2026-01-05", 6000, 6, calendar)
    expect(dates).toHaveLength(6000)
    expect(performance.now() - started).toBeLessThan(1000)
  })
})
