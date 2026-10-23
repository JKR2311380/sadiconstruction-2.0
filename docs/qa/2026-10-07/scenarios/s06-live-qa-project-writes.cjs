// Scenario 06 — live build. Writes are confined to the disposable QA project (PRJ-2026-006) and are reverted at the end
// (BOQ restored to phases A/B, baseline cleared). Retests the checks left inconclusive on 2026-10-06.
const path = require("node:path")
const fs = require("node:fs")
const { open, bug, note, OUT } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5182"
const QA = `${BASE}/projects/9de4aee3-2efc-4805-929b-c462b12b04fd`
const HEADER = "phase_code,phase_name,item_code,description,unit,quantity,rate,amount"

;(async () => {
  const q = await open(BASE)
  const { page, check, snap, errors } = q
  const toast = (text) => page.getByText(text, { exact: false }).first()
  const rowNames = async () => (await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr td:first-child").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
  const sched = async () => {
    await page.goto(`${QA}/scheduling`)
    await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr").first().waitFor({ timeout: 20000 })
    await page.waitForTimeout(1000)
  }

  await check("LIVE-SIGNUP-EXISTING-EMAIL", async () => {
    await page.goto(`${BASE}/signup`)
    await page.locator("#fullName").fill("QA Existing")
    await page.locator("#signup-email").fill("planner@sadicon.local")
    await page.locator("#signup-password").fill("not-the-password-1")
    await page.getByRole("button", { name: "Sign up", exact: true }).click()
    await page.waitForTimeout(3500)
    const url = new URL(page.url()).pathname
    const msg = (await page.locator("form").innerText()).split("\n").filter((l) => /already|registered|invalid|error|exists|rate/i.test(l)).join(" / ")
    return note(`Sign-up with an existing email → url ${url}; message: "${msg}"`)
  })

  await q.login("planner@sadicon.local")
  await page.locator("tbody tr").first().waitFor({ timeout: 20000 })

  let original = []
  await check("LIVE-QA-BOQ-BEFORE", async () => {
    await page.goto(`${QA}/boq`)
    await page.locator("tbody tr").first().waitFor({ timeout: 20000 })
    original = (await page.locator("tbody tr").allInnerTexts()).map((t) => t.replace(/\s+/g, " "))
    return note(original.join(" || "))
  })
  let before = []
  await check("LIVE-QA-SCHEDULE-BEFORE", async () => {
    await sched()
    before = await rowNames()
    return note(JSON.stringify(before))
  })

  const replace = async (body) => {
    await page.goto(`${QA}/boq`)
    await page.locator("tbody tr").first().waitFor({ timeout: 20000 })
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    await page.locator("#boq-csv").fill(`${HEADER}\n${body}\n`)
    await page.getByRole("button", { name: "Preview CSV" }).click()
    const t0 = Date.now()
    await page.getByRole("button", { name: "Confirm replacement" }).click()
    let outcome = "timeout"
    for (let i = 0; i < 80; i++) {
      await page.waitForTimeout(500)
      if (!(await page.getByRole("dialog").count())) {
        outcome = "closed"
        break
      }
      const alert = await page.getByRole("dialog").getByRole("alert").innerText().catch(() => "")
      if (alert) {
        outcome = `error: ${alert}`
        break
      }
    }
    const ms = Date.now() - t0
    if (outcome !== "closed") {
      await snap("s06-boq-replace-outcome")
      await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click().catch(() => {})
    }
    return { outcome, ms }
  }

  await check("LIVE-BOQ-RETENTION-REMOVAL-RENAME", async () => {
    const r = await replace("A,QA Phase A Renamed,A.1,Item A,lot,1,100,100\nC,QA Phase C,C.1,Item C,lot,1,300,300")
    await sched()
    const names = await rowNames()
    await snap("s06-after-replace")
    const renamed = names.some((n) => /QA Phase A Renamed/.test(n))
    const keptKids = before.filter((n) => !/LOCKED/.test(n)).every((n) => names.includes(n))
    const bGone = !names.some((n) => /QA Phase B/.test(n))
    const cAdded = names.some((n) => /QA Phase C/.test(n))
    const summary = `replace outcome=${r.outcome} in ${r.ms} ms; renamed=${renamed} activitiesKept=${keptKids} removedPhaseGone=${bGone} newPhaseAdded=${cAdded}; rows=${JSON.stringify(names)}`
    return r.outcome === "closed" && renamed && keptKids && bGone && cAdded ? `OK — ${summary}` : bug(summary)
  })
  await check("LIVE-BOQ-PROJECT-UPDATED-STAMP", async () => {
    const hdr = (await page.locator("header p").first().innerText()).replace(/\s+/g, " ")
    await page.reload()
    await page.locator("header p").first().waitFor({ timeout: 20000 })
    await page.waitForTimeout(1500)
    const hdr2 = (await page.locator("#app-main header p").first().innerText()).replace(/\s+/g, " ")
    return note(`Project header after BOQ replacement: "${hdr}" → after reload: "${hdr2}"`)
  })

  await check("LIVE-BASELINE-SET-REPLACE-CLEAR", async () => {
    await sched()
    const setBtn = page.getByRole("button", { name: "Set baseline", exact: true })
    if (!(await setBtn.count())) return note("A baseline already exists; skipping to avoid overwriting")
    await setBtn.click()
    await toast("Baseline saved").waitFor()
    await page.waitForTimeout(1500)
    await sched()
    const persisted = await page.getByRole("button", { name: "Re-baseline" }).count()
    await page.getByRole("button", { name: "Re-baseline" }).click()
    // Re-baseline now asks for confirmation.
    await page.getByRole("alertdialog").getByRole("button", { name: "Re-baseline" }).click()
    await toast("Baseline replaced").waitFor()
    await page.waitForTimeout(1500)
    await page.getByRole("button", { name: "Clear baseline" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Clear baseline" }).click()
    await page.waitForTimeout(1500)
    await sched()
    const cleared = (await page.getByRole("button", { name: "Set baseline", exact: true }).count()) === 1
    return persisted && cleared ? "Baseline set → persisted → replaced → cleared (persisted across reloads)" : bug(`persisted=${persisted} cleared=${cleared}`)
  })

  await check("LIVE-QA-BOQ-RESTORE", async () => {
    const r = await replace("A,QA Phase A,A.1,QA item A,lot,1,100,100\nB,QA Phase B,B.1,QA item B,lot,1,100,100")
    await sched()
    const names = await rowNames()
    return note(`Restore outcome=${r.outcome} in ${r.ms} ms; rows=${JSON.stringify(names)} (original BOQ rows were: ${original.join(" || ")})`)
  })

  await q.browser.close()
  fs.writeFileSync(path.join(OUT, "errors-s06.json"), JSON.stringify(errors, null, 2))
  console.log("errors:", errors.length, JSON.stringify(errors.slice(0, 8)))
})()
