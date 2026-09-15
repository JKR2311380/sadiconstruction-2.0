function splitCsvLine(line) {
  const cells = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

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

const PHASE_COLORS = ["a", "b", "c"]

export function parseBoqCsv(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    return { ok: false, error: "CSV needs a header row and at least one line item." }
  }

  const header = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase())
  const missing = REQUIRED.filter((key) => !header.includes(key))
  if (missing.length) {
    return {
      ok: false,
      error: `Missing columns: ${missing.join(", ")}.`,
    }
  }

  const index = Object.fromEntries(header.map((key, i) => [key, i]))
  const phaseMap = new Map()

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line)
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
    const quantity = Number(cells[index.quantity] || 0)
    const rate = Number(cells[index.rate] || 0)
    const amount = Number(cells[index.amount] || quantity * rate)
    phaseMap.get(phaseCode).lines.push({
      id: `line-${phaseCode}-${phaseMap.get(phaseCode).lines.length + 1}`,
      itemCode: cells[index.item_code] || "",
      description: cells[index.description] || "",
      unit: cells[index.unit] || "",
      quantity,
      rate,
      amount,
    })
  }

  return { ok: true, phases: [...phaseMap.values()] }
}

export const BOQ_CSV_TEMPLATE = `phase_code,phase_name,item_code,description,unit,quantity,rate,amount
A,General Requirements,A.1,Mobilization,lot,1,1000000,1000000
B,Site Works,B.1,Clearing,m2,500,80,40000
`
