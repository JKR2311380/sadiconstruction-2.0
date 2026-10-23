import { describe, expect, it } from "vitest"
import { nextChildSlot, orderNodes } from "./wbs"

const n = (id, parentId, sortOrder, extra = {}) => ({ id, parentId, sortOrder, ...extra })

describe("orderNodes", () => {
  it("puts each subtree directly under its parent", () => {
    // The live query returns rows by per-sibling sort_order only (QA-004).
    const rows = [
      n("C.pkg", "C", 1),
      n("B.1", "B.0", 1),
      n("B.0", "B", 1),
      n("A.1", "A", 1),
      n("A", null, 1),
      n("B.2", "B.0", 2),
      n("B", null, 2),
      n("A.2", "A", 2),
      n("C", null, 3),
    ]
    expect(orderNodes(rows).map((row) => row.id)).toEqual([
      "A", "A.1", "A.2", "B", "B.0", "B.1", "B.2", "C", "C.pkg",
    ])
  })

  it("breaks sort ties by creation time and keeps orphans", () => {
    const rows = [
      n("late", "A", 2, { createdAt: "2026-10-06T10:00:00Z" }),
      n("early", "A", 2, { createdAt: "2026-10-06T09:00:00Z" }),
      n("A", null, 1),
      n("orphan", "missing", 1),
    ]
    expect(orderNodes(rows).map((row) => row.id)).toEqual(["A", "early", "late", "orphan"])
  })
})

describe("nextChildSlot", () => {
  it("uses the highest sibling index plus one, not the sibling count", () => {
    const parent = { id: "p", wbsCode: "A.1" }
    const siblings = [
      { id: "x", wbsCode: "A.1.1", sortOrder: 1 },
      { id: "y", wbsCode: "A.1.3", sortOrder: 3 },
    ]
    expect(nextChildSlot(parent, siblings)).toEqual({ wbsCode: "A.1.4", sortOrder: 4 })
  })

  it("starts at one and falls back to seed ids that double as codes", () => {
    expect(nextChildSlot({ id: "A" }, [])).toEqual({ wbsCode: "A.1", sortOrder: 1 })
    expect(
      nextChildSlot({ id: "A" }, [{ id: "A.1", sortOrder: 1 }, { id: "A.4", sortOrder: 4 }]),
    ).toEqual({ wbsCode: "A.5", sortOrder: 5 })
  })
})
