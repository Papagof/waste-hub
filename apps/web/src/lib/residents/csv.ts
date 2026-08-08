/** Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes ("") and CRLF/LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""))
}

export interface ParsedResidentRow {
  rowNumber: number
  fullName: string
  houseUnitNumber: string
  phone: string | null
  email: string | null
  billingPlanName: string
}

export interface CsvParseResult {
  rows: ParsedResidentRow[]
  errors: { rowNumber: number; message: string }[]
}

const REQUIRED_COLUMNS = ["full_name", "house_unit_number", "billing_plan_name"] as const

/** Parses resident CSV text into validated rows. Row numbers are 1-based and count the header row. */
export function parseResidentsCsv(text: string): CsvParseResult {
  const table = parseCsv(text)
  const errors: CsvParseResult["errors"] = []

  if (table.length === 0) {
    return { rows: [], errors: [{ rowNumber: 0, message: "The file is empty." }] }
  }

  const header = table[0].map((h) => h.trim().toLowerCase())
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !header.includes(col))
  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message: `Missing required column(s): ${missingColumns.join(", ")}. Expected header: full_name,house_unit_number,billing_plan_name,phone,email`,
        },
      ],
    }
  }

  const colIndex = (name: string) => header.indexOf(name)
  const rows: ParsedResidentRow[] = []

  for (let i = 1; i < table.length; i++) {
    const raw = table[i]
    const rowNumber = i + 1
    const fullName = raw[colIndex("full_name")]?.trim() ?? ""
    const houseUnitNumber = raw[colIndex("house_unit_number")]?.trim() ?? ""
    const billingPlanName = raw[colIndex("billing_plan_name")]?.trim() ?? ""
    const phone = colIndex("phone") >= 0 ? raw[colIndex("phone")]?.trim() || null : null
    const email = colIndex("email") >= 0 ? raw[colIndex("email")]?.trim() || null : null

    if (!fullName || !houseUnitNumber || !billingPlanName) {
      errors.push({
        rowNumber,
        message: "Missing required value (full_name, house_unit_number, or billing_plan_name).",
      })
      continue
    }

    rows.push({ rowNumber, fullName, houseUnitNumber, phone, email, billingPlanName })
  }

  return { rows, errors }
}
