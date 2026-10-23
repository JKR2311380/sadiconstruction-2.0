// Scenario 07 — live build: restore the QA project's BOQ to its exact pre-session content; probe duplicate-email sign-up.
const { open, bug, note } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5182"
const QA = `${BASE}/projects/9de4aee3-2efc-4805-929b-c462b12b04fd`
;(async () => {
  const q = await open(BASE)
  const { page, check, snap } = q
  await check("LIVE-SIGNUP-EXISTING-EMAIL-DETAIL", async () => {
    await page.goto(`${BASE}/signup`)
    await page.locator("#fullName").fill("QA Existing")
    await page.locator("#signup-email").fill("planner@sadicon.local")
    await page.locator("#signup-password").fill("not-the-password-1")
    const [resp] = await Promise.all([
      page.waitForResponse((r) => /auth\/v1\/signup/.test(r.url()), { timeout: 15000 }),
      page.getByRole("button", { name: "Sign up", exact: true }).click(),
    ])
    await page.waitForTimeout(1500)
    const body = (await resp.text()).slice(0, 160)
    const text = (await page.locator("form").innerText()).replace(/\s+/g, " ")
    await snap("s07-signup-existing-email")
    return note(`HTTP ${resp.status()} ${body} | form text: ${text.slice(-220)}`)
  })
  await q.login("planner@sadicon.local")
  await page.locator("tbody tr").first().waitFor({ timeout: 20000 })
  await check("LIVE-QA-BOQ-RESTORE-EXACT", async () => {
    await page.goto(`${QA}/boq`)
    await page.locator("tbody tr").first().waitFor({ timeout: 20000 })
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    await page.locator("#boq-csv").fill("phase_code,phase_name,item_code,description,unit,quantity,rate,amount\nA,QA Renamed Phase A,A.1,QA item retained,lot,2,100,200\n")
    await page.getByRole("button", { name: "Preview CSV" }).click()
    await page.getByRole("button", { name: "Confirm replacement" }).click()
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 40000 })
    await page.waitForTimeout(800)
    const rows = (await page.locator("tbody tr").allInnerTexts()).map((t) => t.replace(/\s+/g, " "))
    await page.goto(`${QA}/scheduling`)
    await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr").first().waitFor({ timeout: 20000 })
    await page.waitForTimeout(1000)
    const names = (await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr td:first-child").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    const base = await page.getByRole("button", { name: "Set baseline", exact: true }).count()
    return note(`QA project restored: BOQ ${rows.join(" || ")}; schedule ${JSON.stringify(names)}; no baseline=${Boolean(base)}`)
  })
  await q.browser.close()
})()
