import { describe, expect, it } from "vitest"
import { recalculate } from "./index"
import { addWorkingDays, isWorkingDay, workingDateAtIndex } from "./calendar"
import type { CalendarInput, DepType, EngineDependency, EngineNode } from "./types"

const CALENDAR: CalendarInput = {
  workingWeek: { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false },
  exceptions: [],
}

const root: EngineNode = {
  id: "P",
  parentId: null,
  kind: "phase_root",
  durationDays: 0,
  isLoe: false,
}

function leaf(id: string, durationDays: number, extra: Partial<EngineNode> = {}): EngineNode {
  return { id, parentId: "P", kind: "leaf", durationDays, isLoe: false, ...extra }
}

function dep(predecessorId: string, successorId: string, type: DepType = "FS", lagDays = 0): EngineDependency {
  return { predecessorId, successorId, type, lagDays }
}

function run(nodes: EngineNode[], dependencies: EngineDependency[]) {
  const result = recalculate({ nodes: [root, ...nodes], dependencies, calendar: CALENDAR })
  if (!result.ok) throw new Error("expected a valid network")
  return result
}

describe("recalculate", () => {
  it("returns an empty valid result for a network with no leaves", () => {
    const result = run([], [])
    expect(result.projectDurationDays).toBe(0)
    expect(result.criticalIds).toEqual([])
  })

  it("chains finish-to-start activities", () => {
    const result = run([leaf("A", 3), leaf("B", 4)], [dep("A", "B")])
    expect(result.metrics.A).toMatchObject({ es: 0, ef: 3, totalFloat: 0 })
    expect(result.metrics.B).toMatchObject({ es: 3, ef: 7, totalFloat: 0 })
    expect(result.projectDurationDays).toBe(7)
    expect(result.criticalIds).toEqual(["A", "B"])
  })

  it("computes float on the shorter parallel branch", () => {
    const result = run(
      [leaf("A", 5), leaf("B", 2), leaf("C", 1)],
      [dep("A", "C"), dep("B", "C")],
    )
    expect(result.metrics.B.totalFloat).toBe(3)
    expect(result.metrics.B.isCritical).toBe(false)
    expect(result.criticalIds).toEqual(["A", "C"])
    expect(result.projectDurationDays).toBe(6)
  })

  it("applies lag on finish-to-start", () => {
    const result = run([leaf("A", 2), leaf("B", 2)], [dep("A", "B", "FS", 3)])
    expect(result.metrics.B.es).toBe(5)
    expect(result.projectDurationDays).toBe(7)
  })

  it("supports start-to-start with lag", () => {
    const result = run([leaf("A", 6), leaf("B", 2)], [dep("A", "B", "SS", 2)])
    expect(result.metrics.B).toMatchObject({ es: 2, ef: 4 })
    expect(result.projectDurationDays).toBe(6)
    expect(result.metrics.B.totalFloat).toBe(2)
  })

  it("supports finish-to-finish", () => {
    const result = run([leaf("A", 6), leaf("B", 2)], [dep("A", "B", "FF")])
    expect(result.metrics.B).toMatchObject({ es: 4, ef: 6 })
  })

  it("supports start-to-finish", () => {
    const result = run([leaf("A", 4), leaf("B", 3)], [dep("A", "B", "SF", 5)])
    expect(result.metrics.B.ef).toBe(5)
    expect(result.metrics.B.es).toBe(2)
  })

  it("reports a cycle instead of computing", () => {
    const result = recalculate({
      nodes: [root, leaf("A", 1), leaf("B", 1)],
      dependencies: [dep("A", "B"), dep("B", "A")],
      calendar: CALENDAR,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.nodeIds.sort()).toEqual(["A", "B"])
  })

  it("ignores dependencies that point at unknown nodes", () => {
    const result = run([leaf("A", 2)], [dep("A", "GHOST")])
    expect(result.projectDurationDays).toBe(2)
  })

  it("rolls leaf dates up into summaries and phase roots", () => {
    const summary: EngineNode = { id: "S", parentId: "P", kind: "summary", durationDays: 0, isLoe: false }
    const result = run(
      [summary, leaf("A", 2, { parentId: "S" }), leaf("B", 3, { parentId: "S" })],
      [dep("A", "B")],
    )
    expect(result.metrics.S).toMatchObject({ es: 0, ef: 5, totalFloat: null })
    expect(result.metrics.P).toMatchObject({ es: 0, ef: 5 })
  })

  it("spans a level-of-effort node between two activities", () => {
    const loe: EngineNode = {
      id: "L",
      parentId: "P",
      kind: "leaf",
      durationDays: 0,
      isLoe: true,
      spanStartId: "A",
      spanEndId: "B",
    }
    const result = run([leaf("A", 2), leaf("B", 3), loe], [dep("A", "B")])
    expect(result.metrics.L).toMatchObject({ es: 0, ef: 5, isCritical: false })
    expect(result.projectDurationDays).toBe(5)
  })
})

describe("calendar", () => {
  it("treats weekends as non-working and holidays as exceptions", () => {
    expect(isWorkingDay("2026-10-03", CALENDAR)).toBe(false) // Saturday
    expect(isWorkingDay("2026-10-02", CALENDAR)).toBe(true) // Friday
    const withHoliday = { ...CALENDAR, exceptions: [{ date: "2026-10-02", type: "holiday" as const }] }
    expect(isWorkingDay("2026-10-02", withHoliday)).toBe(false)
    const withExtra = { ...CALENDAR, exceptions: [{ date: "2026-10-03", type: "extra_work" as const }] }
    expect(isWorkingDay("2026-10-03", withExtra)).toBe(true)
  })

  it("skips weekends when adding working days", () => {
    expect(addWorkingDays("2026-10-02", 1, CALENDAR)).toBe("2026-10-05") // Fri -> Mon
    expect(addWorkingDays("2026-10-02", 0, CALENDAR)).toBe("2026-10-02")
  })

  it("rolls a non-working project start forward to the first working day", () => {
    expect(workingDateAtIndex("2026-10-03", 0, CALENDAR)).toBe("2026-10-05")
    expect(workingDateAtIndex("2026-10-05", 5, CALENDAR)).toBe("2026-10-12")
  })
})
