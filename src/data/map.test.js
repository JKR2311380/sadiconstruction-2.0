import { describe, expect, it } from "vitest"
import { mapProject } from "./map"

describe("mapProject", () => {
  it("keeps an unset budget as null instead of zero", () => {
    expect(mapProject({ id: "p", budget: null }).budget).toBeNull()
    expect(mapProject({ id: "p" }).budget).toBeNull()
    expect(mapProject({ id: "p", budget: "1500.50" }).budget).toBe(1500.5)
    expect(mapProject({ id: "p", budget: 0 }).budget).toBe(0)
  })
})
