// Scenario 05 — live build: read-only checks + failure handling with injected (never-sent) errors.
// No backend rows are created or changed here: every write request exercised below is intercepted and answered locally.
const path = require("node:path")
const fs = require("node:fs")
const { open, bug, note, OUT } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5182"
const QA_ID = "9de4aee3-2efc-4805-929b-c462b12b04fd"

;(async () => {
  const q = await open(BASE)
  const { page, check, snap, errors, context } = q
  const toast = (text) => page.getByText(text, { exact: false }).first()
  const fail = (pattern, method, status = 503) =>
    context.route(pattern, (route) => {
      if (method && route.request().method() !== method) return route.fallback()
      return route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ message: "QA injected failure", code: "QA503" }) })
    })
  const rowNames = async () => (await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr td:first-child").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())

  // ---------- login failure paths (before signing in) ----------
  await check("LIVE-LOGIN-PROFILE-FAILURE", async () => {
    await fail("**/rest/v1/profiles**")
    await page.goto(`${BASE}/login`)
    await page.locator("#email").fill("planner@sadicon.local")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForTimeout(4000)
    const label = await page.locator("form button[type=submit]").innerText().catch(() => "?")
    const url = new URL(page.url()).pathname
    const msg = await page.getByText(/QA injected|could not|failed|try again/i).count()
    await snap("s05-login-profile-failure")
    await context.unroute("**/rest/v1/profiles**")
    return label.includes("Signing in") && !msg
      ? bug(`When the profile lookup fails after a valid password, the form stays on "${label}" forever with no error (url ${url}); the user must reload`)
      : note(`button="${label}" url=${url} message shown=${Boolean(msg)}`)
  })
  // clean auth state from the half-finished login
  await context.clearCookies()
  await page.goto(BASE + "/login").catch(() => {}); await page.waitForTimeout(500); await page.evaluate(() => localStorage.clear()).catch(() => {})

  await check("LIVE-WORKSPACE-LOAD-FAILURE", async () => {
    await fail("**/rest/v1/projects**", "GET")
    await page.goto(`${BASE}/login`)
    await page.locator("#email").fill("planner@sadicon.local")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForURL(/\/projects/)
    await page.waitForTimeout(2500)
    const text = (await page.locator("#app-main").innerText()).replace(/\s+/g, " ")
    await snap("s05-workspace-load-failure")
    await context.unroute("**/rest/v1/projects**")
    const err = /error|could not|failed|retry|try again/i.test(text)
    return err ? "Load error surfaced" : bug(`When the project list request fails, the directory renders as if the workspace were empty with no error or retry: "${text.slice(0, 150)}"`)
  })

  await page.reload()
  await page.locator("tbody tr").first().waitFor({ timeout: 15000 })

  // ---------- read-only: directory / seeded data ----------
  let dirRows = []
  await check("LIVE-DIRECTORY-SNAPSHOT", async () => {
    dirRows = (await page.locator("tbody tr").allInnerTexts()).map((t) => t.replace(/\s+/g, " "))
    return note(`${dirRows.length} projects: ${dirRows.map((r) => r.slice(0, 70)).join(" || ")}`)
  })
  const openProject = async (name, tab) => {
    await page.goto(`${BASE}/projects`)
    await page.locator("tbody tr", { hasText: name }).first().click()
    await page.waitForURL(/overview/)
    const base = page.url().replace(/\/overview$/, "")
    if (tab) {
      await page.goto(`${base}/${tab}`)
      await page.waitForTimeout(2500)
    }
    return base
  }
  let cwBase
  await check("LIVE-CLEARWATER-BOQ-INTACT", async () => {
    cwBase = await openProject("Clearwater", "boq")
    const parts = (await page.locator("tbody tr", { hasText: /^Part / }).allInnerTexts()).map((t) => t.replace(/\s+/g, " ").slice(0, 40))
    return note(`Clearwater BOQ phases (${parts.length}): ${parts.join(" | ")}`)
  })
  await check("LIVE-CLEARWATER-SCHEDULE-ORDER-LOE", async () => {
    await page.goto(`${cwBase}/scheduling`)
    await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr").first().waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)
    const names = await rowNames()
    await snap("s05-clearwater-schedule")
    const firstRoot = names.findIndex((n) => /LOCKED/.test(n))
    const loe = page.locator("tr", { hasText: /LOE/ }).first()
    const loeCells = (await loe.count()) ? (await loe.locator("td").allInnerTexts()).slice(0, 6).map((t) => t.trim()) : null
    const foot = (await page.locator("footer").last().innerText()).replace(/\s+/g, " ")
    const out = `first phase root at row ${firstRoot + 1} of ${names.length}; order: ${names.map((n) => n.split(" ")[0]).join(",")}; LOE cells: ${JSON.stringify(loeCells)}; footer: ${foot.slice(0, 110)}`
    return firstRoot > 0 ? bug(`Live schedule rows are not in hierarchy order — ${out}`) : note(out)
  })
  await check("LIVE-CLEARWATER-PROGRESS-MISMATCH", async () => {
    const foot = (await page.locator("footer").last().innerText()).replace(/\s+/g, " ")
    const sched = /Complete (\d+)%/.exec(foot)?.[1]
    const dir = /(\d+)% /.exec(dirRows.find((r) => /Clearwater/.test(r)) || "")?.[1]
    return sched === dir ? `Both ${sched}%` : bug(`Directory shows ${dir}% progress for Clearwater; its schedule reports ${sched}% complete`)
  })
  await check("LIVE-TAB-REFOCUS-REHYDRATE", async () => {
    // Open a dialog with typed text, then simulate the tab being hidden and shown again.
    await page.goto(`${cwBase}/personnel`)
    await page.waitForTimeout(1500)
    await page.getByRole("button", { name: "Add person" }).click()
    await page.locator("#per-name").fill("typed but not saved")
    let reqs = 0
    const onReq = (r) => /rest\/v1\/projects/.test(r.url()) && r.method() === "GET" && reqs++
    page.on("request", onReq)
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true })
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await page.waitForTimeout(500)
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true })
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await page.waitForTimeout(4000)
    page.off("request", onReq)
    const stillOpen = await page.locator("#per-name").count()
    const value = stillOpen ? await page.locator("#per-name").inputValue() : null
    if (stillOpen) await page.getByRole("button", { name: "Cancel" }).click()
    return !stillOpen || value !== "typed but not saved"
      ? bug(`Switching away from the tab and back reloads the whole workspace (${reqs} project-list request(s)); the open dialog and its typed text were discarded`)
      : note(`Dialog survived tab refocus; project-list requests triggered=${reqs}`)
  })

  // ---------- QA disposable project: read state ----------
  let qaBase = `${BASE}/projects/${QA_ID}`
  await check("LIVE-QA-PROJECT-STATE", async () => {
    await page.goto(`${qaBase}/overview`)
    await page.waitForTimeout(3000)
    const url = new URL(page.url()).pathname
    if (!url.includes(QA_ID)) return note(`QA project not reachable (redirected to ${url})`)
    const text = (await page.locator("#app-main").innerText()).replace(/\s+/g, " ")
    await snap("s05-qa-overview")
    return note(text.slice(0, 600))
  })
  await check("LIVE-OVERVIEW-BUDGET-FALSE-OVERRUN", async () => {
    const text = (await page.locator("#app-main").innerText()).replace(/\s+/g, " ")
    const budget = /Budget (\S+)/.exec(text)?.[1]
    const over = /(\S+) over budget/.exec(text)?.[0]
    const action = /Review the BOQ exceeding the project budget/.test(text)
    return budget === "₱0" && over
      ? bug(`A project with no budget set shows Budget "${budget}", "${over}" and the next action "Review the BOQ exceeding the project budget"=${action} — unset budget is treated as zero`)
      : note(`budget=${budget} over=${over} action=${action}`)
  })
  await check("LIVE-OVERVIEW-START-DATE-DEADEND", async () => {
    const link = page.getByRole("link", { name: /Set the project start date/ })
    if (!(await link.count())) return note("Start-date action not offered")
    await link.click()
    await page.waitForTimeout(800)
    const url = new URL(page.url()).pathname
    const editor = await page.locator("input[type=date]").count()
    return url === "/projects" && !editor ? bug('"Set the project start date in project details" leads to the project directory; no start-date control exists anywhere') : note(`url=${url} date inputs=${editor}`)
  })
  await check("LIVE-QA-SCHEDULE-STATE", async () => {
    await page.goto(`${qaBase}/scheduling`)
    await page.waitForTimeout(3500)
    const names = await rowNames()
    const foot = (await page.locator("footer").last().innerText().catch(() => "")).replace(/\s+/g, " ")
    await snap("s05-qa-schedule")
    return note(`rows: ${JSON.stringify(names)} | ${foot.slice(0, 160)}`)
  })
  await check("LIVE-SCHEDULE-LOADING-STATE", async () => {
    // Delay the schedule request and read what the tab says meanwhile.
    await context.route("**/rest/v1/schedule_nodes**", async (route) => {
      await new Promise((r) => setTimeout(r, 2500))
      return route.fallback()
    })
    await page.goto(`${qaBase}/scheduling`)
    await page.waitForTimeout(1200)
    const text = (await page.locator("#app-main").innerText()).replace(/\s+/g, " ")
    await snap("s05-schedule-loading")
    await context.unroute("**/rest/v1/schedule_nodes**")
    await page.waitForTimeout(3000)
    return /No schedule yet/.test(text) ? bug('While the schedule is still loading the tab states "No schedule yet — Load an approved BOQ to establish project phases" (no loading indicator) even though the project has a BOQ and activities') : note(text.slice(-160))
  })
  await check("LIVE-SCHEDULE-LOAD-FAILURE", async () => {
    await fail("**/rest/v1/schedule_nodes**", "GET")
    await page.goto(`${qaBase}/scheduling`)
    await page.waitForTimeout(3500)
    const text = (await page.locator("#app-main").innerText()).replace(/\s+/g, " ")
    await page.getByRole("tab", { name: "Overview" }).click()
    await page.waitForTimeout(800)
    const ov = (await page.locator("#app-main").innerText()).replace(/\s+/g, " ")
    await snap("s05-schedule-load-failure")
    await context.unroute("**/rest/v1/schedule_nodes**")
    const says = /No schedule yet/.test(text)
    return says
      ? bug(`When the schedule request fails the tab permanently shows "No schedule yet — Load an approved BOQ…" with no error or retry; Overview then reports "${/Critical path finish (No activities|\S+ \S+)/.exec(ov)?.[1]}" / "${/Schedule complete (No activities|\S+)/.exec(ov)?.[1]}" and suggests "Add activities and predecessor links"`)
      : note(text.slice(-200))
  })

  // ---------- injected write failures (requests never reach the backend) ----------
  await page.goto(`${qaBase}/scheduling`)
  await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr").first().waitFor({ timeout: 15000 })
  await page.waitForTimeout(800)

  await check("LIVE-ADD-ACTIVITY-SAVE-FAILURE", async () => {
    await fail("**/rest/v1/schedule_nodes**", "POST")
    const before = (await rowNames()).length
    await page.getByRole("button", { name: "+ Activity" }).click()
    const dlg = page.getByRole("dialog")
    await dlg.locator("#add-name").fill("QA never saved")
    await dlg.getByRole("button", { name: "Add", exact: true }).click()
    await page.waitForTimeout(1500)
    const success = await toast("Activity added").count()
    const errToast = await page.getByText(/could not|failed|QA injected|not saved/i).count()
    const after = (await rowNames()).length
    await snap("s05-add-activity-save-failure")
    await context.unroute("**/rest/v1/schedule_nodes**")
    await page.reload()
    await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr").first().waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)
    const reloaded = (await rowNames()).some((n) => /QA never saved/.test(n))
    return success && !errToast && after === before + 1 && !reloaded
      ? bug('Server rejects the new activity (HTTP 503) yet the UI toasts "Activity added" and keeps the row; it vanishes on reload. No error is shown.')
      : note(`success toast=${success} error toast=${errToast} rows ${before}→${after} afterReload=${reloaded}`)
  })
  await check("LIVE-PROGRESS-SAVE-FAILURE", async () => {
    await fail("**/rest/v1/schedule_nodes**", "POST")
    const input = page.locator("input[aria-label$='percent complete']").first()
    const label = await input.getAttribute("aria-label")
    const old = await input.inputValue()
    const next = old === "77" ? "66" : "77"
    await input.fill(next)
    await input.press("Enter")
    await page.waitForTimeout(1500)
    const errToast = await page.getByText(/could not|failed|QA injected|not saved/i).count()
    const shown = await page.locator(`input[aria-label="${label}"]`).first().inputValue()
    await context.unroute("**/rest/v1/schedule_nodes**")
    await page.reload()
    await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr").first().waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)
    const persisted = await page.locator(`input[aria-label="${label}"]`).first().inputValue()
    return !errToast && shown === next && persisted === old
      ? bug(`Progress edit (${old}→${next}%) rejected by the server shows no error; UI keeps ${shown}% until reload restores ${persisted}%`)
      : note(`errToast=${errToast} shown=${shown} persisted=${persisted} (was ${old})`)
  })
  await check("LIVE-BASELINE-SAVE-FAILURE", async () => {
    await fail("**/rest/v1/schedule_baselines**")
    const btn = page.getByRole("button", { name: /^(Set baseline|Re-baseline)$/ })
    const label = await btn.innerText()
    if (await btn.isDisabled()) {
      await context.unroute("**/rest/v1/schedule_baselines**")
      return note(`Baseline button "${label}" disabled; skipped`)
    }
    await btn.click()
    await page.waitForTimeout(1500)
    const ok = await page.getByText(/Baseline (saved|replaced)/).count()
    const errToast = await page.getByText(/could not|failed|QA injected|not saved/i).count()
    await context.unroute("**/rest/v1/schedule_baselines**")
    return ok && !errToast ? bug(`"${label}" toasts success although the server rejected the baseline write (HTTP 503); nothing is saved and no error appears`) : note(`ok=${ok} err=${errToast}`)
  })
  await check("LIVE-DEPENDENCY-SAVE-FAILURE", async () => {
    await page.reload()
    await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr").first().waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)
    await fail("**/rest/v1/dependencies**", "DELETE")
    const cell = page.getByTitle(/Edit predecessors: [^–]/).first()
    if (!(await cell.count())) {
      await context.unroute("**/rest/v1/dependencies**")
      return note("No existing link to test removal against")
    }
    await cell.click()
    const dlg = page.getByRole("dialog")
    await dlg.getByRole("button", { name: /Remove predecessor/ }).first().click()
    await page.waitForTimeout(1500)
    const alert = await dlg.getByRole("alert").innerText().catch(() => "")
    await context.unroute("**/rest/v1/dependencies**")
    await dlg.getByRole("button", { name: "Done" }).click()
    return alert ? `Dependency failure surfaced in dialog: "${alert}"` : bug("Dependency delete failure not surfaced")
  })
  await check("LIVE-PERSONNEL-SAVE-FAILURE", async () => {
    await page.goto(`${qaBase}/personnel`)
    await page.waitForTimeout(1500)
    await fail("**/rest/v1/project_personnel**", "POST")
    await page.getByRole("button", { name: "Add person" }).click()
    await page.locator("#per-name").fill("QA never saved")
    await page.locator("#per-title").fill("None")
    await page.getByRole("button", { name: "Add", exact: true }).click()
    await page.waitForTimeout(1500)
    const err = await page.getByText(/QA injected failure|Could not add/).count()
    const open = await page.getByRole("dialog").count()
    await context.unroute("**/rest/v1/project_personnel**")
    if (open) await page.getByRole("button", { name: "Cancel" }).click()
    return err && open ? "Personnel save failure shows a toast and keeps the dialog open" : bug(`err toast=${err} dialog open=${open}`)
  })
  await check("LIVE-CREATE-PROJECT-FAILURE", async () => {
    await page.goto(`${BASE}/projects`)
    await page.locator("tbody tr").first().waitFor({ timeout: 15000 })
    await fail("**/rest/v1/projects**", "POST")
    await fail("**/rest/v1/rpc/next_project_code**")
    await page.getByRole("button", { name: "Add Project" }).click()
    await page.locator("#proj-name").fill("QA never created")
    await page.getByRole("button", { name: "Create" }).click()
    await page.waitForTimeout(2000)
    const err = await page.getByText(/QA injected failure|could not|failed/i).count()
    const open = await page.getByRole("dialog").count()
    const submit = open ? await page.getByRole("button", { name: /Create/ }).innerText() : ""
    await snap("s05-create-project-failure")
    await context.unroute("**/rest/v1/projects**")
    await context.unroute("**/rest/v1/rpc/next_project_code**")
    if (open) await page.getByRole("button", { name: "Cancel" }).click()
    return !err ? bug(`Create Project fails silently when the server rejects it: dialog stays open (open=${Boolean(open)}, button "${submit}") with no error message; an unhandled promise rejection is logged`) : "Error surfaced"
  })
  await check("LIVE-CREATE-PROJECT-NO-PENDING-STATE", async () => {
    // Hold the insert so we can observe the button, then abort it (nothing is created).
    let hits = 0
    await context.route("**/rest/v1/projects**", async (route) => {
      if (route.request().method() !== "POST") return route.fallback()
      hits++
      await new Promise((r) => setTimeout(r, 1500))
      return route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"QA injected failure"}' })
    })
    await page.getByRole("button", { name: "Add Project" }).click()
    await page.locator("#proj-name").fill("QA never created 2")
    const create = page.getByRole("button", { name: "Create" })
    await create.click()
    await page.waitForTimeout(300)
    const disabled = await create.isDisabled()
    await create.click().catch(() => {})
    await create.click().catch(() => {})
    await page.waitForTimeout(3500)
    await context.unroute("**/rest/v1/projects**")
    await page.getByRole("button", { name: "Cancel" }).click().catch(() => {})
    return !disabled && hits > 1 ? bug(`Create button is not disabled while saving; three quick clicks sent ${hits} insert requests (would create duplicate projects on a slow connection)`) : note(`disabled=${disabled} inserts=${hits}`)
  })
  await check("LIVE-SETTINGS-RESET-DEMO-NOOP", async () => {
    await page.goto(`${BASE}/settings`)
    await page.getByRole("button", { name: "Reset demo data" }).first().click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo data" }).click()
    const ok = await toast("Demo data restored").count()
    await snap("s05-reset-demo-live")
    return ok ? bug('With the live backend, Settings still offers "Reset demo data"; confirming shows "Demo data restored" although nothing happens') : note("No success toast")
  })
  await check("LIVE-BANNER-WORDING", async () => {
    const banner = await page.locator("p.no-print").first().innerText()
    return note(`Live build banner: "${banner}"`)
  })
  await check("LIVE-SESSION-EXPIRED", async () => {
    // Drop the stored session while the app is open, then try to load data.
    await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("sb-")).forEach((k) => localStorage.removeItem(k)))
    await page.goto(`${BASE}/projects`)
    await page.waitForTimeout(2500)
    const url = new URL(page.url()).pathname
    return url.startsWith("/login") ? "Missing session redirects to login" : note(`url=${url}`)
  })

  await q.browser.close()
  fs.writeFileSync(path.join(OUT, "errors-s05.json"), JSON.stringify(errors.filter((e) => !/QA injected/.test(e.body || "")), null, 2))
  console.log("errors:", errors.length)
})()
