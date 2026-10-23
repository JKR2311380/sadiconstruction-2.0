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

  const HEADER = "phase_code,phase_name,item_code,description,unit,quantity,rate,amount"

  it("keeps a quoted multi-line field as one cell", () => {
    const { ok, phases } = parseBoqCsv(`${HEADER}\nA,General,A.1,"First line\nSecond line",lot,1,100,100\nA,General,A.2,Next,lot,1,1,1\n`)
    expect(ok).toBe(true)
    expect(phases[0].lines).toHaveLength(2)
    expect(phases[0].lines[0].description).toBe("First line\nSecond line")
  })

  it("reads thousands separators, currency symbols and spaces in numbers", () => {
    const { phases } = parseBoqCsv(`${HEADER}\nA,General,A.1,x,lot,"1,500","₱ 1,000.50","PHP 1,500,750"\n`)
    expect(phases[0].lines[0]).toMatchObject({ quantity: 1500, rate: 1000.5, amount: 1500750 })
  })

  it("accepts semicolon-delimited files", () => {
    const { ok, phases } = parseBoqCsv(`${HEADER.replace(/,/g, ";")}\nA;General;A.1;One;lot;2;10.5;21\n`)
    expect(ok).toBe(true)
    expect(phases[0].lines[0]).toMatchObject({ itemCode: "A.1", quantity: 2, rate: 10.5, amount: 21 })
  })

  it("fails closed on a decimal comma instead of guessing", () => {
    const semi = parseBoqCsv(`${HEADER.replace(/,/g, ";")}\nA;General;A.1;One;lot;1;1.000,50;1.000,50\n`)
    expect(semi.ok).toBe(false)
    expect(semi.error).toMatch(/Row 2/)
    expect(semi.error).toMatch(/1\.000,50/)
    expect(parseBoqCsv(`${HEADER}\nA,General,A.1,One,lot,1,"12,5","12,5"\n`).ok).toBe(false)
    // In a semicolon file "1,000" could be one thousand or one: refuse it.
    expect(parseBoqCsv(`${HEADER.replace(/,/g, ";")}\nA;General;A.1;One;lot;1;1,000;1,000\n`).ok).toBe(false)
  })

  it("still rejects negative and non-numeric values", () => {
    expect(parseBoqCsv(`${HEADER}\nA,General,A.1,x,lot,-1,1,1\n`).ok).toBe(false)
    expect(parseBoqCsv(`${HEADER}\nA,General,A.1,x,lot,abc,1,1\n`).ok).toBe(false)
  })

  it("keeps an explicit zero amount", () => {
    expect(parseBoqCsv(`${HEADER}\nA,General,A.1,Free issue,lot,2,100,0\n`).phases[0].lines[0].amount).toBe(0)
  })

  it("returns no warnings for a clean file", () => {
    expect(parseBoqCsv(BOQ_CSV_TEMPLATE).warnings).toEqual([])
  })

  it("warns about rows that should be questioned without blocking the import", () => {
    const result = parseBoqCsv(
      [
        HEADER,
        "A,General,A.1,Mobilization,lot,2,100,999999",
        "A,Something Else,A.1,Duplicate code,lot,1,1,1",
        "B,Site,,,,,,",
      ].join("\n"),
    )
    expect(result.ok).toBe(true)
    expect(result.phases).toHaveLength(2)
    expect(result.phases[0].name).toBe("General")
    const text = result.warnings.join(" | ")
    expect(result.warnings).toHaveLength(4)
    expect(text).toMatch(/Row 2.*amount 999999.*200/)
    expect(text).toMatch(/Row 3.*phase A.*Something Else.*General/)
    expect(text).toMatch(/Row 3.*item code A\.1.*more than once/)
    expect(text).toMatch(/Row 4.*no item/)
  })
})
