// BOQ CSV contract, v2 (ADR 0007: bad files fail closed, nothing is partly imported).
// - One header row with these columns, in any order and case: phase_code, phase_name,
//   item_code, description, unit, quantity, rate, amount.
// - Columns are separated by commas, semicolons or tabs (taken from the header row).
// - A field may be wrapped in double quotes; inside quotes, "" is a quote and line
//   breaks and separators are kept as text.
// - Numbers use a dot for decimals. Currency symbols and spaces are ignored. Thousands
//   commas ("1,000,000") are read only in comma-separated files; any other comma in a
//   number is refused, because it could be a decimal comma.
// - A blank amount is quantity x rate. Negative numbers are refused.
// Rows that parse but look wrong are returned as `warnings` for the preview step.

const REQUIRED = [
  "phase_code",
  "phase_name",
  "item_code",
  "description",
  "unit",
  "quantity",
  "rate",
  "amount",
]

const PHASE_COLORS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"]

function detectDelimiter(text) {
  const header = text.split(/\r?\n/).find((line) => line.trim()) || ""
  const count = (char) => header.split(char).length - 1
  return [",", ";", "\t"].reduce((best, char) => (count(char) > count(best) ? char : best))
}

/** Reads the whole text at once so quoted fields may span lines. Blank rows are dropped. */
function readRows(text, delimiter) {
  const rows = []
  let row = []
  let cell = ""
  let inQuotes = false
  const endCell = () => {
    row.push(cell.trim())
    cell = ""
  }
  const endRow = () => {
    endCell()
    if (row.some(Boolean)) rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char !== '"') cell += char
      else if (text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else inQuotes = false
    } else if (char === '"') inQuotes = true
    else if (char === delimiter) endCell()
    else if (char === "\n") endRow()
    else if (char === "\r") {
      if (text[i + 1] !== "\n") endRow()
    } else cell += char
  }
  endRow()
  return rows
}

/** null = blank cell, NaN = not readable without guessing. */
function readNumber(raw, delimiter) {
  const text = String(raw ?? "").replace(/php|[₱$\s]/gi, "")
  if (!text) return null
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return Number(text)
  if (delimiter === "," && /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) {
    return Number(text.replace(/,/g, ""))
  }
  return NaN
}

export function parseBoqCsv(text) {
  const source = String(text || "").replace(/^\uFEFF/, "")
  const delimiter = detectDelimiter(source)
  const rows = readRows(source, delimiter)
  if (rows.length < 2) {
    return { ok: false, error: "CSV needs a header row and at least one line item." }
  }

  const header = rows[0].map((cell) => cell.toLowerCase())
  const missing = REQUIRED.filter((key) => !header.includes(key))
  if (missing.length) {
    return {
      ok: false,
      error: `Missing columns: ${missing.join(", ")}.${
        missing.length === REQUIRED.length
          ? " Check that the first row is the header and that columns are separated by commas or semicolons."
          : ""
      }`,
    }
  }

  const index = Object.fromEntries(header.map((key, i) => [key, i]))
  const phaseMap = new Map()
  const warnings = []

  for (const [i, cells] of rows.slice(1).entries()) {
    const rowLabel = `Row ${i + 2}`
    const phaseCode = cells[index.phase_code]
    const phaseName = cells[index.phase_name]
    if (!phaseCode || !phaseName) {
      return { ok: false, error: "Every row needs phase_code and phase_name." }
    }
    if (!phaseMap.has(phaseCode)) {
      const sortOrder = phaseMap.size + 1
      phaseMap.set(phaseCode, {
        id: `phase-${phaseCode.toLowerCase()}`,
        code: phaseCode,
        name: phaseName,
        colorToken: PHASE_COLORS[(sortOrder - 1) % PHASE_COLORS.length],
        sortOrder,
        lines: [],
      })
    }
    const phase = phaseMap.get(phaseCode)
    if (phase.name !== phaseName) {
      warnings.push(`${rowLabel}: phase ${phaseCode} is named "${phaseName}" here but "${phase.name}" earlier. "${phase.name}" is kept.`)
    }

    const numbers = {}
    for (const key of ["quantity", "rate", "amount"]) {
      const value = readNumber(cells[index[key]], delimiter)
      if (Number.isNaN(value)) {
        return {
          ok: false,
          error: `${rowLabel}: cannot read "${cells[index[key]]}" as a ${key}. Use a dot for decimals, for example 1000.50.`,
        }
      }
      if (value < 0) {
        return { ok: false, error: `${rowLabel}: ${key} cannot be negative.` }
      }
      numbers[key] = value
    }
    const quantity = numbers.quantity ?? 0
    const rate = numbers.rate ?? 0
    const amount = numbers.amount ?? quantity * rate

    const itemCode = cells[index.item_code] || ""
    const description = cells[index.description] || ""
    const unit = cells[index.unit] || ""
    if (!itemCode && !description && !unit && Object.values(numbers).every((value) => value == null)) {
      warnings.push(`${rowLabel}: no item, description or numbers. It is imported as a ₱0 line.`)
    }
    if (numbers.quantity != null && numbers.rate != null && numbers.amount != null && Math.abs(amount - quantity * rate) > 0.01) {
      warnings.push(`${rowLabel}: amount ${amount} does not equal quantity × rate (${quantity * rate}).`)
    }
    if (itemCode && phase.lines.some((line) => line.itemCode === itemCode)) {
      warnings.push(`${rowLabel}: item code ${itemCode} appears more than once in phase ${phaseCode}.`)
    }

    phase.lines.push({
      id: `line-${phaseCode}-${phase.lines.length + 1}`,
      itemCode,
      description,
      unit,
      quantity,
      rate,
      amount,
    })
  }

  return { ok: true, phases: [...phaseMap.values()], warnings }
}

export const BOQ_CSV_TEMPLATE = `phase_code,phase_name,item_code,description,unit,quantity,rate,amount
A,General Requirements,A.1,Mobilization,lot,1,1000000,1000000
B,Site Works,B.1,Clearing,m2,500,80,40000
`
