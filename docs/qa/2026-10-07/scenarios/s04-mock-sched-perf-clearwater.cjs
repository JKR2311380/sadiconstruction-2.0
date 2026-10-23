// Scenario 04 — mock build: large-duration behaviour, Clearwater seed checks, mobile.
const path = require("node:path")
const fs = require("node:fs")
const { open, bug, note, OUT } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5181"

;(async () => {
  let q = await open(BASE)
  let { page, check, snap, errors } = q
  await q.login("planner@sadicon.local")
  const rowNames = async () => (await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr td:first-child").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
  const addNode = async (parentText, name, dur) => {
    await page.getByRole("button", { name: "+ Activity" }).click()
    const dlg = page.getByRole("dialog")
    await dlg.getByRole("combobox").click()
    await page.getByRole("option", { name: parentText }).first().click()
    await dlg.locator("#add-name").fill(name)
    await dlg.locator("#add-dur").fill(String(dur))
    await dlg.getByRole("button", { name: "Add", exact: true }).click()
    await page.waitForTimeout(350)
  }

  await check("SCHED-FIX-NETWORK-WIPES-EDITS", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/scheduling`)
    await page.waitForTimeout(500)
    await addNode(/^A /, "QA Marker Activity", 2)
    const added = (await rowNames()).some((n) => /QA Marker Activity/.test(n))
    await page.getByRole("button", { name: "Simulate cycle" }).click()
    await page.getByRole("button", { name: "Fix network" }).click()
    await page.waitForTimeout(300)
    if (await page.getByRole("alertdialog").count()) {
      await page.getByRole("alertdialog").getByRole("button", { name: "Fix network" }).click()
      return "Fix network asks for confirmation and names what is lost"
    }
    await page.waitForTimeout(500)
    const still = (await rowNames()).some((n) => /QA Marker Activity/.test(n))
    return !added ? note("marker not added") : still ? "Edits preserved" : bug('"Fix network" restores the entire seed schedule: an activity added before the cycle was silently deleted, with no confirmation')
  })
  await check("SCHED-LOE-ROW", async () => {
    const row = page.locator("tr", { hasText: "Supervision (LOE)" }).first()
    const cells = (await row.locator("td").allInnerTexts()).slice(0, 6).map((t) => t.trim())
    return note(`Seed LOE row cells (name,dur,pred,ES,EF,TF): ${JSON.stringify(cells)}`)
  })
  await check("SCHED-COLLAPSE-STATE", async () => {
    const all = (await rowNames()).length
    await page.getByRole("button", { name: "Critical only" }).click()
    const crit = (await rowNames()).length
    await page.getByRole("button", { name: "Critical only" }).click()
    await page.getByRole("button", { name: /^Toggle A / }).first().click()
    const collapsed = (await rowNames()).length
    return note(`rows all=${all} criticalOnly=${crit} collapsedA=${collapsed}`)
  })
  await check("SCHED-ADD-UNDER-COLLAPSED-PARENT-DEFAULT", async () => {
    await page.getByRole("button", { name: "+ Activity" }).click()
    const dlg = page.getByRole("dialog")
    const parent = await dlg.getByRole("combobox").innerText()
    await dlg.getByRole("button", { name: "Cancel" }).click()
    await page.locator("tr", { hasText: "C.pkg" }).first().click().catch(() => {})
    await page.getByRole("button", { name: "+ Activity" }).click()
    const parent2 = await dlg.getByRole("combobox").innerText()
    await dlg.getByRole("button", { name: "Cancel" }).click()
    return note(`"+ Activity" default parent="${parent}"; after selecting a row under another phase default parent="${parent2}" (always the first phase, ignores selection)`)
  })
  await check("SCHED-TODAY-LINE-AND-START", async () => {
    const today = await page.getByLabel(/^Today,/).count()
    const axis = (await page.locator("thead th").last().innerText()).split("\n").slice(0, 3).join(" | ")
    return note(`Today line visible=${Boolean(today)}; axis starts: ${axis}`)
  })
  await check("PROJ-NEW-START-DATE-TZ", async () => {
    await page.goto(`${BASE}/projects`)
    await page.getByRole("button", { name: "Add Project" }).click()
    await page.locator("#proj-name").fill("QA TZ")
    await page.getByRole("button", { name: "Create" }).click()
    await page.waitForURL(/overview/)
    const info = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("sadicon-workspace")).state.projects.find((p) => p.name === "QA TZ")
      const d = new Date()
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      return { start: s.startDate, local, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }
    })
    return info.start === info.local
      ? `start ${info.start} matches local date`
      : bug(`Mock project start date uses the UTC date: stored ${info.start} while the local date is ${info.local} (${info.tz}) — off by one day before 08:00 PH time. Same pattern in TodayLine and document "Updated" dates (toISOString().slice(0,10))`)
  })

  // perf: escalating durations on a fresh project
  const perfUrl = page.url().replace(/\/overview$/, "")
  await page.goto(`${perfUrl}/boq`)
  await page.getByRole("button", { name: "Replace via CSV" }).click()
  await page.getByRole("button", { name: "Preview CSV" }).click()
  await page.getByRole("button", { name: "Confirm replacement" }).click()
  await page.waitForTimeout(400)
  await page.goto(`${perfUrl}/scheduling`)
  await addNode(/General/, "Perf", 5)
  for (const days of [1000, 5000, 20000]) {
    await check(`SCHED-DURATION-PERF-${days}`, async () => {
      const input = page.getByLabel(/Perf duration in working days/).first()
      const t0 = Date.now()
      await input.fill(String(days), { timeout: 20000 })
      await input.press("Enter", { timeout: 60000 })
      // Durations are capped at 3650 working days (QA-015 fix).
      await page.locator("footer").last().getByText(`${Math.min(days, 3650)} working days`).waitFor({ timeout: 60000 })
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const ms = Date.now() - t0
      const cells = await page.locator("thead th").last().locator("span").count()
      return ms > 3000 ? bug(`Duration ${days} days: UI blocked ${ms} ms, ${cells} week cells rendered`) : note(`Duration ${days} days: ${ms} ms, ${cells} week cells`)
    })
  }
  await check("SCHED-DURATION-200000-FREEZE", async () => {
    const input = page.getByLabel(/Perf duration in working days/).first()
    await input.fill("200000", { timeout: 60000 })
    const t0 = Date.now()
    let hung = false
    try {
      await input.press("Enter", { timeout: 30000 })
      await page.evaluate(() => 1, undefined)
      await page.locator("footer").last().getByText("3650 working days").waitFor({ timeout: 30000 })
    } catch {
      hung = true
    }
    const ms = Date.now() - t0
    // new page in same context: does the persisted value freeze the tab on load?
    const p2 = await q.context.newPage()
    let reloadHung = false
    const t1 = Date.now()
    try {
      await p2.goto(`${perfUrl}/scheduling`, { timeout: 30000 })
      await p2.locator("footer").last().getByText(/working days/).waitFor({ timeout: 30000 })
      await p2.evaluate(() => 1)
    } catch {
      reloadHung = true
    }
    const ms2 = Date.now() - t1
    let overviewOk = true
    const p3 = await q.context.newPage()
    try {
      await p3.goto(`${perfUrl}/overview`, { timeout: 20000 })
      await p3.getByText("Critical path finish").waitFor({ timeout: 20000 })
    } catch {
      overviewOk = false
    }
    return hung || reloadHung
      ? bug(`Typing duration 200000 freezes the tab (commit hung=${hung} after ${ms} ms). The value is saved, so reopening Scheduling for that project hangs again (hung=${reloadHung}, ${ms2} ms); Overview loads=${overviewOk}. No upper bound on duration.`)
      : note(`200000 handled: commit ${ms} ms, reopen ${ms2} ms, overview ok=${overviewOk}`)
  })
  await q.browser.close().catch(() => {})

  // ---------- mobile ----------
  q = await open(BASE, { viewport: { width: 390, height: 844 } })
  ;({ page, check, snap } = q)
  await q.login("planner@sadicon.local")
  await check("MOBILE-TAB-STRIP-OVERFLOW", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/overview`)
    await page.getByRole("tab", { name: "Scheduling" }).scrollIntoViewIfNeeded()
    await page.getByRole("tab", { name: "Scheduling" }).click()
    await page.waitForTimeout(600)
    const m = await page.evaluate(() => {
      const el = document.getElementById("app-main")
      return { client: el.clientWidth, scroll: el.scrollWidth, left: el.scrollLeft }
    })
    await snap("s04-mobile-scheduling")
    return m.scroll > m.client + 4 ? bug(`Phone 390px: main region scrolls sideways (client ${m.client}px, scroll ${m.scroll}px, offset ${m.left}px) after opening Scheduling tab`) : `No horizontal overflow (${m.client}/${m.scroll})`
  })
  await check("MOBILE-DIRECTORY-TABLE", async () => {
    await page.goto(`${BASE}/projects`)
    await page.waitForTimeout(400)
    const m = await page.evaluate(() => {
      const el = document.getElementById("app-main")
      const table = document.querySelector("table")
      return { client: el.clientWidth, scroll: el.scrollWidth, table: table?.scrollWidth, wrap: table?.parentElement?.clientWidth }
    })
    await snap("s04-mobile-directory")
    return note(`Directory at 390px: main ${m.client}/${m.scroll}px, table ${m.table}px in ${m.wrap}px wrapper`)
  })
  await check("MOBILE-NAV-DRAWER-SIGNOUT", async () => {
    await page.getByRole("button", { name: "Open navigation" }).click()
    await page.getByRole("link", { name: "Settings" }).click()
    await page.waitForURL(/settings/)
    const drawerClosed = (await page.getByRole("dialog").count()) === 0
    await page.getByRole("button", { name: "Open navigation" }).click()
    await page.getByRole("button", { name: "Sign out" }).click()
    await page.waitForURL(/login/)
    return drawerClosed ? "Drawer navigation + sign out work" : bug("Drawer stays open after navigating")
  })
  await q.browser.close()
  fs.writeFileSync(path.join(OUT, "errors-s04.json"), JSON.stringify(errors, null, 2))
  console.log("errors:", errors.length, JSON.stringify(errors.slice(0, 6)))
})()
