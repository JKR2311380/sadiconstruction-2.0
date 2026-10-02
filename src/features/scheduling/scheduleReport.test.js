import { describe, expect, it } from "vitest"
import { computeProgress, finishVariance, makeBaseline, overallProgress, scheduleToCsv } from "./scheduleReport"

const nodes = [
  { id: "P", parentId: null, kind: "phase_root", name: "A – Site", wbsCode: "A" },
  { id: "a1", parentId: "P", kind: "leaf", name: "Clear", wbsCode: "A.1", durationDays: 2, progressPct: 100 },
  { id: "a2", parentId: "P", kind: "leaf", name: "Excavate, deep", wbsCode: "A.2", durationDays: 6, progressPct: 50 },
]
const dependencies = [{ predecessorId: "a1", successorId: "a2", type: "FS", lagDays: 1 }]
const metrics = {
  P: { es: 0, ef: 9, totalFloat: null, isCritical: false },
  a1: { es: 0, ef: 2, ls: 0, lf: 2, totalFloat: 0, isCritical: true },
  a2: { es: 3, ef: 9, ls: 3, lf: 9, totalFloat: 0, isCritical: true },
}
const calendar = {
  workingWeek: { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false },
  exceptions: [],
}

describe("progress", () => {
  it("weights parents by leaf duration", () => {
    // (100*2 + 50*6) / 8 = 62.5 -> 63
    expect(computeProgress(nodes).P).toBe(63)
    expect(overallProgress(nodes)).toBe(63)
  })

  it("clamps bad values and handles zero-duration leaves", () => {
    const odd = [
      { id: "P", parentId: null, kind: "phase_root" },
      { id: "x", parentId: "P", kind: "leaf", durationDays: 0, progressPct: 150 },
      { id: "y", parentId: "P", kind: "leaf", durationDays: 0, progressPct: -5 },
    ]
    const result = computeProgress(odd)
    expect(result.x).toBe(100)
    expect(result.y).toBe(0)
    expect(result.P).toBe(50)
  })
})

describe("baseline", () => {
  it("snapshots es/ef and reports finish variance", () => {
    const baseline = makeBaseline(metrics, 9, "2026-10-01T00:00:00.000Z")
    expect(baseline.nodes.a2).toEqual({ es: 3, ef: 9 })
    const slipped = { ...metrics, a2: { ...metrics.a2, ef: 12 } }
    expect(finishVariance(baseline, "a2", slipped)).toBe(3)
    expect(finishVariance(null, "a2", slipped)).toBeNull()
  })
})

describe("scheduleToCsv", () => {
  it("emits a header, quotes commas and writes working dates from the start date", () => {
    const baseline = makeBaseline(metrics, 9)
    const csv = scheduleToCsv({
      nodes,
      dependencies,
      metrics,
      baseline,
      calendar,
      startDate: "2026-10-05",
    })
    const lines = csv.trim().split("\r\n")
    expect(lines[0]).toMatch(/^wbs,level,name,type,duration_days/)
    expect(lines).toHaveLength(4)
    expect(lines[3]).toContain('"Excavate, deep"')
    expect(lines[3]).toContain("A.1FS+1")
    // a2 starts at working-day index 3 from Mon 2026-10-05 -> Thu 2026-10-08
    expect(lines[3]).toContain("2026-10-08")
  })

  it("leaves dates blank when the project has no start date", () => {
    const csv = scheduleToCsv({ nodes, dependencies, metrics, baseline: null, calendar, startDate: null })
    expect(csv).not.toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})
