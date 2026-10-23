import { describe, expect, it } from "vitest"
import { clampDays, MAX_DAYS, todayIso } from "./utils"

describe("todayIso", () => {
  it("uses the local calendar day, not the UTC one", () => {
    // 04:45 local time is still the previous day in UTC for zones ahead of it.
    expect(todayIso(new Date(2026, 9, 7, 4, 45))).toBe("2026-10-07")
    expect(todayIso(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01")
    expect(todayIso(new Date(2026, 11, 31, 23, 55))).toBe("2026-12-31")
  })
})

describe("clampDays", () => {
  it("rounds to whole days and bounds the range", () => {
    expect(clampDays(2.5)).toBe(3)
    expect(clampDays("7")).toBe(7)
    expect(clampDays(-4)).toBe(0)
    expect(clampDays(200000)).toBe(MAX_DAYS)
    expect(clampDays("abc")).toBe(0)
    expect(clampDays(Infinity)).toBe(0)
  })

  it("allows negative values when the minimum is negative", () => {
    expect(clampDays(-1.5, -MAX_DAYS)).toBe(-1)
    expect(clampDays(-9999, -MAX_DAYS)).toBe(-MAX_DAYS)
  })
})
