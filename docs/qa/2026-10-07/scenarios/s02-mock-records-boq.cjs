// Scenario 02 — mock build: personnel, documents, BOQ import edge cases.
const path = require("node:path")
const { open, bug, note, OUT } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5181"
// Upload fixtures are generated outside the repository (big.bin is 51 MB).
const FILES = path.join(require("node:os").tmpdir(), "sadicon-qa-files")
{
  const fs = require("node:fs")
  fs.mkdirSync(FILES, { recursive: true })
  const make = (name, content) => fs.existsSync(path.join(FILES, name)) || fs.writeFileSync(path.join(FILES, name), content)
  make("small.txt", "small test file\n")
  make("empty.txt", "")
  make("notcsv.png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 1, 2, 3]))
  make("big.bin", Buffer.alloc(51 * 1024 * 1024))
}

;(async () => {
  const q = await open(BASE)
  const { page, check, snap, errors } = q
  const toast = (text) => page.getByText(text, { exact: false }).first()
  await q.login("planner@sadicon.local")

  // fresh project to work in
  await page.getByRole("button", { name: "Add Project" }).click()
  await page.locator("#proj-name").fill("QA Records Project")
  await page.locator("#proj-client").fill("QA Client")
  await page.getByRole("button", { name: "Create" }).click()
  await page.waitForURL(/overview/)
  const projUrl = page.url().replace(/\/overview$/, "")

  await check("PROJ-TAB-BACK-BUTTON-RETEST", async () => {
    await page.getByRole("tab", { name: "Documents" }).click()
    await page.waitForURL(/documents/)
    await page.getByRole("tab", { name: "Bill of Quantities" }).click()
    await page.waitForURL(/boq/)
    await page.goBack()
    await page.waitForTimeout(1500)
    const url = new URL(page.url()).pathname.split("/").pop()
    const sel = await page.getByRole("tab", { selected: true }).innerText()
    return url === "documents" && sel === "Documents" ? "Back returns to previous tab" : bug(`After Back: url tab=${url}, selected tab=${sel}`)
  })

  // ---------- personnel ----------
  await page.goto(`${projUrl}/personnel`)
  const addPerson = async ({ name, title, start, end }) => {
    await page.getByRole("button", { name: "Add person" }).click()
    await page.locator("#per-name").fill(name)
    await page.locator("#per-title").fill(title)
    if (start) await page.locator("#per-start").fill(start)
    if (end) await page.locator("#per-end").fill(end)
    await page.getByRole("button", { name: "Add", exact: true }).click()
    await page.waitForTimeout(600)
  }
  await check("PERSONNEL-WHITESPACE", async () => {
    await addPerson({ name: "   ", title: "   " })
    const open = await page.getByRole("dialog").count()
    if (open) {
      await page.getByRole("button", { name: "Cancel" }).click()
      return "Whitespace-only name/title rejected"
    }
    await snap("s02-personnel-whitespace")
    return bug("Whitespace-only name and title accepted; blank roster row created")
  })
  await check("PERSONNEL-REVERSED-DATES", async () => {
    await addPerson({ name: "QA Reversed", title: "Engineer", start: "2026-10-30", end: "2026-10-01" })
    const row = await page.locator("tbody tr", { hasText: "QA Reversed" }).count()
    // A rejected entry leaves the dialog open; close it so later checks can run.
    if (await page.getByRole("dialog").count()) await page.getByRole("button", { name: "Cancel" }).click()
    return row ? bug("End date before start date accepted (2026-10-30 → 2026-10-01)") : "rejected"
  })
  await check("PERSONNEL-DUPLICATE", async () => {
    await addPerson({ name: "QA Dup", title: "Foreman" })
    await addPerson({ name: "QA Dup", title: "Foreman" })
    const rows = await page.locator("tbody tr", { hasText: "QA Dup" }).count()
    return note(`Identical person can be added ${rows} times (no duplicate warning)`)
  })
  await check("PERSONNEL-NO-EDIT", async () => {
    const btns = await page.locator("tbody tr").first().getByRole("button").allInnerTexts()
    return btns.some((t) => /edit/i.test(t)) ? "Edit available" : note(`Roster rows only offer: ${btns.join(", ")} — fixing a typo or setting an end date requires remove + re-add`)
  })
  await check("PERSONNEL-REMOVE-AND-PERSIST", async () => {
    // "QA Reversed" is no longer created (reversed dates are refused), so remove a "QA Dup" row.
    await page.locator("tbody tr", { hasText: "QA Dup" }).first().getByRole("button", { name: "Remove" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click()
    await toast("Personnel removed").waitFor()
    await page.reload()
    await page.waitForTimeout(600)
    const gone = (await page.locator("tbody tr", { hasText: "QA Reversed" }).count()) === 0
    const kept = await page.locator("tbody tr", { hasText: "QA Dup" }).count()
    return gone && kept === 1 ? "Removal persisted across reload" : bug(`gone=${gone} kept=${kept}`)
  })

  // ---------- documents ----------
  await page.goto(`${projUrl}/documents`)
  await check("DOCS-OVERSIZE-AFTER-VALID", async () => {
    await page.getByRole("button", { name: "Upload document" }).click()
    await page.locator("#doc-file").setInputFiles(path.join(FILES, "small.txt"))
    await page.waitForTimeout(200)
    await page.locator("#doc-file").setInputFiles(path.join(FILES, "big.bin"))
    await toast("exceeds the 50 MB").waitFor()
    const inputEmpty = (await page.locator("#doc-file").evaluate((el) => el.files.length)) === 0
    const enabled = await page.getByRole("button", { name: "Upload", exact: true }).isEnabled()
    const title = await page.locator("#doc-title").inputValue()
    if (enabled) {
      await snap("s02-doc-stale-selection")
      await page.getByRole("button", { name: "Upload", exact: true }).click({ force: true })
      await page.waitForTimeout(700)
      const uploaded = await page.locator("tbody tr", { hasText: "small.txt" }).count()
      if (await page.getByRole("dialog").count()) await page.getByRole("button", { name: "Cancel" }).click()
      return bug(`After the oversize rejection the file input is empty=${inputEmpty} but Upload stays enabled with stale title "${title}"; clicking Upload ${uploaded ? "silently uploads the earlier small.txt" : "is blocked by native required validation"}`)
    }
    await page.getByRole("button", { name: "Cancel" }).click()
    return "Upload disabled after oversize rejection"
  })
  await check("DOCS-EMPTY-FILE-AND-BLANK-TITLE", async () => {
    await page.getByRole("button", { name: "Upload document" }).click()
    await page.locator("#doc-file").setInputFiles(path.join(FILES, "empty.txt"))
    await page.locator("#doc-title").fill("   ")
    await page.locator("#doc-type").fill("")
    // An empty file is refused at selection, which leaves Upload disabled.
    if (await page.getByRole("button", { name: "Upload", exact: true }).isDisabled()) {
      await page.getByRole("button", { name: "Cancel" }).click()
      return "Rejected: empty file refused when chosen"
    }
    await page.getByRole("button", { name: "Upload", exact: true }).click()
    await page.waitForTimeout(700)
    const stillOpen = await page.getByRole("dialog").count()
    if (stillOpen) {
      await page.getByRole("button", { name: "Cancel" }).click()
      return "Rejected"
    }
    await snap("s02-doc-blank-title")
    return bug("0-byte file with whitespace-only title and empty type accepted; document row has no visible title")
  })
  await check("DOCS-BLANK-TITLE-AND-VALID-UPLOAD", async () => {
    await page.getByRole("button", { name: "Upload document" }).click()
    await page.locator("#doc-file").setInputFiles(path.join(FILES, "small.txt"))
    await page.locator("#doc-title").fill("   ")
    await page.getByRole("button", { name: "Upload", exact: true }).click()
    await page.waitForTimeout(500)
    const blankRejected = (await page.getByRole("dialog").count()) === 1
    await page.locator("#doc-title").fill("  QA Small  ")
    await page.getByRole("button", { name: "Upload", exact: true }).click()
    await page.waitForTimeout(700)
    const titles = await page.locator("tbody tr td:first-child").allInnerTexts()
    return blankRejected && titles.includes("QA Small") ? "Blank title rejected; valid upload stored with a trimmed title" : bug(`blankRejected=${blankRejected} titles=${JSON.stringify(titles)}`)
  })
  await check("DOCS-OPEN-MOCK", async () => {
    const row = page.locator("tbody tr").first()
    await row.getByRole("button", { name: "Open" }).click()
    await toast("No stored file in this mock session").waitFor()
    return note("Mock mode: Open shows 'No stored file in this mock session' (documents are metadata-only without Supabase)")
  })
  await check("DOCS-SEEDED-OPEN", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/documents`)
    const rows = await page.locator("tbody tr").count()
    return note(`Clearwater seed lists ${rows} documents; none can be opened in mock mode`)
  })
  await check("DOCS-ARCHIVE-PERSIST-NO-RESTORE", async () => {
    await page.goto(`${projUrl}/documents`)
    const before = await page.locator("tbody tr").count()
    await page.locator("tbody tr").first().getByRole("button", { name: "Archive" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Archive" }).click()
    await toast("Document archived").waitFor()
    await page.reload()
    await page.waitForTimeout(500)
    const after = await page.locator("tbody tr").count()
    const restore = await page.getByText(/archived|restore/i).count()
    return after === before - 1 || (before === 1 && after === 0)
      ? note(`Archive persisted (${before}→${after}); no archived-documents view or restore control exists (${restore} matches)`)
      : bug(`rows ${before}→${after}`)
  })

  // ---------- BOQ ----------
  await page.goto(`${projUrl}/boq`)
  const HEADER = "phase_code,phase_name,item_code,description,unit,quantity,rate,amount"
  const tryCsv = async (csv) => {
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    await page.locator("#boq-csv").fill(csv)
    await page.getByRole("button", { name: "Preview CSV" }).click()
    await page.waitForTimeout(300)
    const preview = await page.getByLabel("BOQ replacement preview").count()
    const text = preview ? await page.getByLabel("BOQ replacement preview").innerText() : await page.getByRole("alert").innerText().catch(() => "")
    return { preview: Boolean(preview), text }
  }
  const cancel = async () => {
    await page.getByRole("button", { name: "Cancel" }).click()
    await page.waitForTimeout(200)
  }
  await check("BOQ-ERROR-STICKS-AFTER-CANCEL", async () => {
    const r = await tryCsv("bogus")
    await cancel()
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    const alert = await page.getByRole("alert").count()
    const csv = await page.locator("#boq-csv").inputValue()
    await cancel()
    return alert ? bug(`Reopening the dialog after Cancel still shows the previous error ("${r.text}") and the rejected text "${csv}"`) : note(`Error cleared on reopen; textarea still holds previous text "${csv.slice(0, 20)}"`)
  })
  await check("BOQ-MULTILINE-QUOTED", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,A.1,"First line\nSecond line",lot,1,100,100\n`)
    await cancel()
    return r.preview ? "Multiline quoted field parsed" : bug(`Valid CSV with a quoted multi-line description rejected: "${r.text}"`)
  })
  await check("BOQ-THOUSANDS-SEPARATOR", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,A.1,Mobilization,lot,1,"1,000,000","1,000,000"\n`)
    await cancel()
    return r.preview ? "Parsed" : bug(`Quoted amounts with thousands separators ("1,000,000") rejected: "${r.text}"`)
  })
  await check("BOQ-CURRENCY-SYMBOL", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,A.1,Mobilization,lot,1,₱1000,₱1000\n`)
    await cancel()
    return note(`Amounts with currency symbol → preview=${r.preview} "${r.text.slice(0, 90)}"`)
  })
  await check("BOQ-AMOUNT-MISMATCH", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,A.1,Mobilization,lot,2,100,999999\n`)
    await cancel()
    if (r.preview && /Check before confirming/.test(r.text)) return "Accepted with a warning in the preview"
    return r.preview ? bug(`quantity 2 × rate 100 with amount 999999 accepted without any warning (preview: ${r.text.split("\n")[0]})`) : "Rejected"
  })
  await check("BOQ-ZERO-AMOUNT-FALLBACK", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,A.1,Free issue item,lot,2,100,0\n`)
    await cancel()
    return /₱200/.test(r.text) ? bug(`Explicit amount 0 is replaced by quantity × rate (preview shows ₱200) — an intentional zero cannot be imported`) : note(`amount 0 → ${r.text.split("\n")[0]}`)
  })
  await check("BOQ-BLANK-ITEM-AND-DESCRIPTION", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,,,,,,\n`)
    await cancel()
    if (r.preview && /Check before confirming/.test(r.text)) return "Accepted with a warning in the preview"
    return r.preview ? bug(`Row with no item code, description, unit, quantity, rate or amount accepted (${r.text.split("\n")[0]})`) : "Rejected"
  })
  await check("BOQ-INCONSISTENT-PHASE-NAME", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,A.1,One,lot,1,1,1\nA,Something Else,A.2,Two,lot,1,1,1\n`)
    await cancel()
    if (r.preview && /Check before confirming/.test(r.text)) return "Accepted with a warning in the preview"
    return r.preview ? note(`Same phase_code with two different phase_name values accepted; first name wins silently (${r.text.split("\n")[0]})`) : "Rejected"
  })
  await check("BOQ-DUPLICATE-ITEM-CODES", async () => {
    const r = await tryCsv(`${HEADER}\nA,General,A.1,One,lot,1,1,1\nA,General,A.1,One again,lot,1,1,1\n`)
    await cancel()
    if (r.preview && /Check before confirming/.test(r.text)) return "Accepted with a warning in the preview"
    return r.preview ? note("Duplicate item_code within a phase accepted without warning") : "Rejected"
  })
  await check("BOQ-CASE-COLLISION", async () => {
    const before = errors.length
    const r = await tryCsv(`${HEADER}\nA,Upper,A.1,One,lot,1,10,10\na,Lower,a.1,Two,lot,1,20,20\n`)
    let detail = `preview=${r.preview} ${r.text.split("\n")[0]}`
    if (r.preview) {
      await page.getByRole("button", { name: "Confirm replacement" }).click()
      await page.waitForTimeout(600)
      const parts = await page.locator("tbody tr", { hasText: /^Part / }).count()
      await page.goto(`${projUrl}/scheduling`)
      await page.waitForTimeout(600)
      const roots = await page.locator("tbody tr", { hasText: "LOCKED" }).count()
      await snap("s02-boq-case-collision")
      const keyWarn = errors.slice(before).filter((e) => /same key/.test(e.message)).length
      await page.goto(`${projUrl}/boq`)
      return roots === 2 && parts === 2
        ? `Two phases, two roots`
        : bug(`Phase codes "A" and "a": BOQ shows ${parts} phases but Scheduling shows ${roots} phase root(s) (mock ids collide; duplicate-key console errors=${keyWarn})`)
    }
    await cancel()
    return note(detail)
  })
  await check("BOQ-SEMICOLON-DELIMITER", async () => {
    const r = await tryCsv(`${HEADER.replace(/,/g, ";")}\nA;General;A.1;One;lot;1;1;1\n`)
    await cancel()
    return note(`Semicolon-delimited CSV (Excel regional export) → "${r.text.slice(0, 120)}"`)
  })
  await check("BOQ-NON-CSV-FILE", async () => {
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    await page.locator("#boq-file").setInputFiles(path.join(FILES, "notcsv.png"))
    await page.waitForTimeout(300)
    const text = await page.locator("#boq-csv").inputValue()
    await page.getByRole("button", { name: "Preview CSV" }).click()
    await page.waitForTimeout(300)
    const alert = await page.getByRole("alert").innerText().catch(() => "")
    await cancel()
    return note(`Binary file chosen as CSV is loaded into the textarea as text (${text.length} chars); preview error: "${alert}"`)
  })
  await check("BOQ-FILE-RESELECT-SAME", async () => {
    // choose a file, edit text, choose same file again -> onChange does not fire for identical selection
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    const csvPath = path.join(FILES, "boq-a.csv")
    require("node:fs").writeFileSync(csvPath, `${HEADER}\nA,General,A.1,Mobilization,lot,1,100,100\nB,Site Works,B.1,Clearing,m2,10,5,50\n`)
    await page.locator("#boq-file").setInputFiles(csvPath)
    await page.waitForTimeout(200)
    const loaded = (await page.locator("#boq-csv").inputValue()).includes("Site Works")
    await page.getByRole("button", { name: "Preview CSV" }).click()
    await page.getByRole("button", { name: "Confirm replacement" }).click()
    await toast("BOQ replaced").waitFor()
    return loaded ? "CSV file loads and imports" : bug("File content not loaded")
  })
  await check("BOQ-REPLACE-DEFAULT-TEMPLATE-RISK", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/boq`)
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    const csv = await page.locator("#boq-csv").inputValue()
    await page.getByRole("button", { name: "Preview CSV" }).click()
    const text = await page.getByLabel("BOQ replacement preview").innerText()
    await snap("s02-boq-template-preview")
    await cancel()
    return note(`Replace dialog on a project with a real BOQ opens pre-filled with the 2-line sample template (${csv.split("\n").length - 1} lines), not the current BOQ; no export/download of the current BOQ exists. Preview: ${text.split("\n").slice(0, 2).join(" | ")}`)
  })

  await q.browser.close()
  require("node:fs").writeFileSync(path.join(OUT, "errors-s02.json"), JSON.stringify(errors, null, 2))
  console.log("errors:", errors.length, JSON.stringify(errors.slice(0, 6)))
})()
