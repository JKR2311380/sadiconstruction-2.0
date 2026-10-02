import { describe, expect, it } from "vitest"
import { BOQ_CSV_TEMPLATE, parseBoqCsv } from "./csv"

describe("parseBoqCsv", () => {
  it("parses the bundled template into phases and lines", () => {
    const result = parseBoqCsv(BOQ_CSV_TEMPLATE)
    expect(result.ok).toBe(true)
    expect(result.phases.map((phase) => phase.code)).toEqual(["A", "B"])
    expect(result.phases[0].lines[0]).toMatchObject({ itemCode: "A.1", quantity: 1, rate: 1000000 })
  })

  it("groups rows by phase_code and keeps phase order and colors", () => {
    const csv = [
      "phase_code,phase_name,item_code,description,unit,quantity,rate,amount",
      "A,One,A.1,x,lot,1,10,10",
      "B,Two,B.1,y,lot,1,20,20",
      "A,One,A.2,z,lot,2,5,10",
    ].join("\n")
    const { phases } = parseBoqCsv(csv)
    expect(phases).toHaveLength(2)
    expect(phases[0].lines).toHaveLength(2)
    expect(phases.map((phase) => phase.colorToken)).toEqual(["a", "b"])
    expect(phases.map((phase) => phase.sortOrder)).toEqual([1, 2])
  })

  it("derives amount from quantity x rate when it is blank", () => {
    const csv = "phase_code,phase_name,item_code,description,unit,quantity,rate,amount\nA,One,A.1,x,m2,4,25,"
    expect(parseBoqCsv(csv).phases[0].lines[0].amount).toBe(100)
  })

  it("handles quoted commas, escaped quotes, BOM and CRLF", () => {
    const csv =
      '﻿phase_code,phase_name,item_code,description,unit,quantity,rate,amount\r\nA,"Site, Works",A.1,"12"" pipe",m,1,1,1\r\n'
    const { ok, phases } = parseBoqCsv(csv)
    expect(ok).toBe(true)
    expect(phases[0].name).toBe("Site, Works")
    expect(phases[0].lines[0].description).toBe('12" pipe')
  })

  it("accepts header columns in any order and case", () => {
    const csv = "AMOUNT,Rate,quantity,unit,description,item_code,phase_name,phase_code\n10,5,2,m,x,A.1,One,A"
    expect(parseBoqCsv(csv).phases[0].lines[0]).toMatchObject({ quantity: 2, rate: 5, amount: 10 })
  })

  it("fails closed on empty input, missing columns and blank phases", () => {
    expect(parseBoqCsv("").ok).toBe(false)
    expect(parseBoqCsv("phase_code,phase_name").ok).toBe(false)
    const missing = parseBoqCsv("phase_code,phase_name\nA,One")
    expect(missing.error).toMatch(/Missing columns/)
    const blank = parseBoqCsv(
      "phase_code,phase_name,item_code,description,unit,quantity,rate,amount\n,,A.1,x,m,1,1,1",
    )
    expect(blank).toEqual({ ok: false, error: "Every row needs phase_code and phase_name." })
  })
})
