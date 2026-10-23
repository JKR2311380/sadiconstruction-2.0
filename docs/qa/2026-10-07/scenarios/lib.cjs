// QA harness helpers (2026-10-07 session). Each scenario is a standalone node script.
const fs = require("node:fs")
const path = require("node:path")
const { chromium } = require(process.env.QA_PLAYWRIGHT || "C:/Users/Yushin/AppData/Local/Temp/sadicon-qa-playwright/node_modules/playwright")

// Reruns set QA_OUT so the 2026-10-07 results stay as the baseline.
const OUT = process.env.QA_OUT || "C:/Users/Yushin/orca/sadiconstruction-2.0/docs/qa/2026-10-07"
fs.mkdirSync(path.join(OUT, "evidence"), { recursive: true })
const RESULTS = path.join(OUT, "results.json")

function load() {
  return fs.existsSync(RESULTS) ? JSON.parse(fs.readFileSync(RESULTS, "utf8")) : []
}
function record(id, status, details) {
  const rows = load()
  rows.push({ id, status, details })
  fs.writeFileSync(RESULTS, JSON.stringify(rows, null, 2))
  console.log(`[${status}] ${id} :: ${typeof details === "string" ? details : JSON.stringify(details)}`)
}

async function open(base, { viewport = { width: 1440, height: 1000 }, name = "ctx" } = {}) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport, acceptDownloads: true })
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  const errors = []
  page.on("pageerror", (e) => errors.push({ type: "pageerror", message: e.message }))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push({ type: "console", message: m.text().slice(0, 400) })
  })
  page.on("response", async (r) => {
    if (r.status() >= 400)
      errors.push({ type: "http", status: r.status(), url: r.url().split("?")[0], body: (await r.text().catch(() => "")).slice(0, 300) })
  })
  const snap = async (file) => {
    await page.screenshot({ path: path.join(OUT, "evidence", `${file}.png`), fullPage: false })
    return `evidence/${file}.png`
  }
  const check = async (id, fn) => {
    try {
      const out = await fn()
      if (out && out.status) record(id, out.status, out.details)
      else record(id, "PASS", out ?? "")
    } catch (e) {
      record(id, "ERROR", String(e.message).split("\n")[0].slice(0, 300))
    }
  }
  const login = async (email = "planner@sadicon.local", password = "demo123") => {
    await page.goto(`${base}/login`)
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForURL(/\/projects/)
  }
  return { browser, context, page, errors, snap, check, login, base, name }
}

const bug = (details) => ({ status: "FAIL", details })
const note = (details) => ({ status: "OBSERVED", details })

module.exports = { open, record, bug, note, OUT }
