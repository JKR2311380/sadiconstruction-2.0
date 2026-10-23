// Scenario 03 — mock build: scheduling flows on a fresh project + Clearwater seed.
const path = require("node:path")
const fs = require("node:fs")
const { open, bug, note, OUT } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5181"

;(async () => {
  const q = await open(BASE)
  const { page, check, snap, errors } = q
  const toast = (text) => page.getByText(text, { exact: false }).first()
  await q.login("planner@sadicon.local")

  await check("PROJ-TAB-BACK-PROBE", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/overview`)
    const h0 = await page.evaluate(() => history.length)
    await page.getByRole("tab", { name: "Documents" }).click()
    await page.waitForURL(/documents/)
    const h1 = await page.evaluate(() => history.length)
    await page.getByRole("tab", { name: "Bill of Quantities" }).click()
    await page.waitForURL(/boq/)
    const h2 = await page.evaluate(() => history.length)
    const seq = []
    page.on("framenavigated", (f) => f === page.mainFrame() && seq.push(new URL(f.url()).pathname.split("/").pop()))
    await page.evaluate(() => history.back())
    await page.waitForTimeout(1500)
    const end = new URL(page.url()).pathname.split("/").pop()
    const h3 = await page.evaluate(() => history.length)
    return end === "documents"
      ? `Back works (history ${h0}→${h1}→${h2})`
      : bug(`Browser Back from BOQ tab ends on "${end}" instead of "documents". History length ${h0}→${h1}→${h2}→${h3}; navigations after Back: ${seq.join(" → ")} (tab strip re-pushes the focused tab)`)
  })

  // fresh project
  await page.goto(`${BASE}/projects`)
  await page.getByRole("button", { name: "Add Project" }).click()
  await page.locator("#proj-name").fill("QA Schedule Project")
  await page.getByRole("button", { name: "Create" }).click()
  await page.waitForURL(/overview/)
  const projUrl = page.url().replace(/\/overview$/, "")

  await check("SCHED-NO-BOQ-GATE", async () => {
    await page.goto(`${projUrl}/scheduling`)
    await page.getByText("No BOQ phases").waitFor()
    const add = await page.getByRole("button", { name: "+ Activity" }).isDisabled()
    const sim = await page.getByRole("button", { name: "Simulate cycle" }).count()
    return add ? note(`Activity buttons disabled without BOQ. "Simulate cycle" demo button visible=${Boolean(sim)}`) : bug("+ Activity enabled without BOQ")
  })
  await check("SCHED-SIMULATE-CYCLE-DEAD-BUTTON", async () => {
    // The demo button is now hidden where it cannot work (QA-034 fix).
    if (!(await page.getByRole("button", { name: "Simulate cycle" }).count())) return "Hidden on projects without the demo network"
    await page.getByRole("button", { name: "Simulate cycle" }).click()
    await page.waitForTimeout(400)
    const alert = await page.getByText("Dependency cycle", { exact: true }).count()
    return alert ? "Cycle simulated" : bug('"Simulate cycle" does nothing on any project except the Clearwater seed (hard-coded to activities B.2/B.3) — no feedback')
  })

  // import BOQ
  const HEADER = "phase_code,phase_name,item_code,description,unit,quantity,rate,amount"
  const importBoq = async (body) => {
    await page.goto(`${projUrl}/boq`)
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    await page.locator("#boq-csv").fill(`${HEADER}\n${body}\n`)
    await page.getByRole("button", { name: "Preview CSV" }).click()
    await page.getByRole("button", { name: "Confirm replacement" }).click()
    await toast("BOQ replaced").waitFor()
    await page.waitForTimeout(300)
  }
  await importBoq("A,Alpha,A.1,One,lot,1,100,100\nB,Bravo,B.1,Two,lot,1,200,200\nC,Charlie,C.1,Three,lot,1,300,300")
  await page.goto(`${projUrl}/scheduling`)

  const addNode = async (mode, parentText, name, dur) => {
    await page.getByRole("button", { name: mode === "summary" ? "+ Nested summary" : "+ Activity" }).click()
    const dlg = page.getByRole("dialog")
    await dlg.getByRole("combobox").click()
    await page.getByRole("option", { name: parentText }).first().click()
    await dlg.locator("#add-name").fill(name)
    if (mode === "leaf" && dur != null) await dlg.locator("#add-dur").fill(String(dur))
    await dlg.getByRole("button", { name: "Add", exact: true }).click()
    await page.waitForTimeout(350)
  }
  const rowNames = async () => (await page.locator("section[aria-label='Activity schedule and Gantt chart'] tbody tr td:first-child").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())

  await check("SCHED-ADD-AND-LABELS", async () => {
    await addNode("summary", /Alpha/, "Substructure")
    await addNode("leaf", /Substructure/, "Excavation", 5)
    await addNode("leaf", /Substructure/, "Footings", 4)
    await addNode("leaf", /Bravo/, "Framing", 6)
    const names = await rowNames()
    await snap("s03-new-activities")
    const odd = names.filter((n) => /\.[a-z0-9]{4}\b/.test(n))
    return odd.length
      ? bug(`New activities display random generated ids as their WBS code in mock mode: ${JSON.stringify(names)}`)
      : note(`Rows: ${JSON.stringify(names)}`)
  })
  await check("SCHED-SUMMARY-TOAST-WORDING", async () => {
    await addNode("summary", /Bravo/, "Shell")
    const t = await toast("Activity added").count()
    return t ? note('Adding a nested summary toasts "Activity added"') : "ok"
  })
  await check("SCHED-DUPLICATE-NAMES", async () => {
    await addNode("leaf", /Bravo/, "Framing", 2)
    const names = (await rowNames()).filter((n) => /Framing/.test(n))
    return note(`Two activities with the same name under one parent accepted: ${JSON.stringify(names)}`)
  })
  await check("SCHED-ADD-DECIMAL-AND-HUGE-DURATION-FORM", async () => {
    await page.getByRole("button", { name: "+ Activity" }).click()
    const dlg = page.getByRole("dialog")
    await dlg.locator("#add-name").fill("Decimal")
    await dlg.locator("#add-dur").fill("2.5")
    await dlg.getByRole("button", { name: "Add", exact: true }).click()
    await page.waitForTimeout(300)
    const blocked = await dlg.count()
    if (blocked) await dlg.getByRole("button", { name: "Cancel" }).click()
    return note(`Add-activity form with duration 2.5 → ${blocked ? "blocked by native step validation" : "accepted"}`)
  })

  const durInput = (name) => page.getByLabel(new RegExp(`${name} duration in working days`)).first()
  const pctInput = (name) => page.getByLabel(new RegExp(`${name} percent complete`)).first()
  const commit = async (loc, v) => {
    await loc.fill(String(v))
    await loc.press("Enter")
    await page.waitForTimeout(300)
  }
  const footer = async () => (await page.locator("footer").last().innerText()).replace(/\s+/g, " ")

  await check("SCHED-INLINE-DECIMAL-DURATION", async () => {
    await commit(durInput("Excavation"), "2.5")
    const v = await durInput("Excavation").inputValue()
    const f = await footer()
    await commit(durInput("Excavation"), "5")
    return v === "2.5" ? bug(`Inline duration accepts fractional working days (2.5) although the add form enforces whole days; footer: ${f.slice(0, 60)}`) : `Stored ${v}`
  })
  await check("SCHED-INLINE-NEGATIVE-AND-TEXT", async () => {
    await commit(durInput("Excavation"), "-4")
    const v = await durInput("Excavation").inputValue()
    await commit(durInput("Excavation"), "5")
    return note(`Typing -4 silently becomes ${v} (no validation message)`)
  })
  await check("SCHED-PROGRESS-BOUNDS", async () => {
    await commit(pctInput("Excavation"), "250")
    const hi = await pctInput("Excavation").inputValue()
    await commit(pctInput("Excavation"), "-5")
    const lo = await pctInput("Excavation").inputValue()
    await commit(pctInput("Excavation"), "50")
    return hi === "100" && lo === "0" ? "Progress clamped to 0–100 (silently)" : bug(`250→${hi}, -5→${lo}`)
  })

  // predecessors
  const openPred = async (name) => {
    await page.locator("tr", { hasText: name }).first().getByTitle(/Edit predecessors/).click()
    await page.getByRole("dialog").waitFor()
  }
  const addLink = async (predName, type = "FS", lag = "0") => {
    const dlg = page.getByRole("dialog")
    await dlg.getByRole("combobox").first().click()
    await page.getByRole("option", { name: predName }).first().click()
    if (type !== "FS") {
      await dlg.getByRole("combobox").nth(1).click()
      await page.getByRole("option", { name: type, exact: true }).click()
    }
    await dlg.locator("#pred-lag").fill(lag)
    const btn = dlg.getByRole("button", { name: "Add link" })
    const enabled = await btn.isEnabled()
    if (enabled) await btn.click()
    await page.waitForTimeout(300)
    return enabled
  }
  const done = async () => {
    await page.getByRole("dialog").getByRole("button", { name: "Done" }).click()
    await page.waitForTimeout(300)
  }
  await check("SCHED-LINK-FS-AND-METRICS", async () => {
    await openPred("Footings")
    await addLink(/Excavation/)
    await done()
    const f = await footer()
    return /Duration 9 working days/.test(f) ? `FS link computed: ${f.slice(0, 80)}` : bug(`Unexpected footer: ${f}`)
  })
  await check("SCHED-LINK-DECIMAL-LAG", async () => {
    await openPred("Framing")
    const ok = await addLink(/Footings/, "FS", "1.5")
    await done()
    const f = await footer()
    return ok ? bug(`Fractional lag 1.5 accepted (input step=1 is not enforced); footer: ${f.slice(0, 70)}`) : "Blocked"
  })
  await check("SCHED-LINK-HUGE-LAG", async () => {
    await openPred("Framing")
    // The fractional-lag link is now refused, so there may be nothing to remove.
    const remove = page.getByRole("dialog").getByRole("button", { name: /Remove predecessor/ })
    if (await remove.count()) await remove.first().click()
    await page.waitForTimeout(300)
    const ok = await addLink(/Footings/, "FS", "-9999")
    await done()
    const f = await footer()
    return note(`Lag -9999 accepted=${ok}; footer: ${f.slice(0, 90)}`)
  })
  await check("SCHED-CYCLE-CREATE-AND-RECOVER", async () => {
    await openPred("Framing")
    // Out-of-range and fractional lags are now refused, so Framing may have no links to clear.
    const clearAll = page.getByRole("dialog").getByRole("button", { name: "Clear all" })
    if (await clearAll.isEnabled()) await clearAll.click()
    await page.waitForTimeout(300)
    await addLink(/Footings/)
    await done()
    await openPred("Excavation")
    const offered = await (async () => {
      const dlg = page.getByRole("dialog")
      await dlg.getByRole("combobox").first().click()
      const n = await page.getByRole("option", { name: /Framing/ }).count()
      await page.keyboard.press("Escape")
      return n
    })()
    await addLink(/Framing/)
    await page.waitForTimeout(300)
    const cycle = await page.getByText("Dependency cycle", { exact: true }).count()
    await done().catch(() => {})
    await snap("s03-cycle")
    const fix = await page.getByRole("button", { name: "Fix network" }).count()
    let fixWorks = null
    if (fix) {
      await page.getByRole("button", { name: "Fix network" }).click()
      await page.waitForTimeout(400)
      fixWorks = (await page.getByText("Dependency cycle", { exact: true }).count()) === 0
    }
    // recover manually
    if (await page.getByText("Dependency cycle", { exact: true }).count()) {
      await openPred("Excavation")
      await page.getByRole("dialog").getByRole("button", { name: "Clear all" }).click()
      await done()
    }
    const cleared = (await page.getByText("Dependency cycle", { exact: true }).count()) === 0
    return cycle
      ? bug(`The predecessor picker offers a successor (Framing) as a predecessor of Excavation (options=${offered}) and saves the link, putting the whole schedule into a cycle state instead of refusing it. "Fix network" button shown=${Boolean(fix)}, resolves the cycle=${fixWorks}. Manual recovery worked=${cleared}`)
      : "Cycle prevented"
  })

  // baseline
  await check("SCHED-BASELINE-FLOW", async () => {
    await page.getByRole("button", { name: "Set baseline" }).click()
    await toast("Baseline saved").waitFor()
    await commit(durInput("Footings"), "10")
    const f1 = await footer()
    await page.getByRole("button", { name: "Re-baseline" }).click()
    await page.waitForTimeout(300)
    const confirm1 = await page.getByRole("alertdialog").count()
    if (confirm1) await page.getByRole("alertdialog").getByRole("button", { name: "Re-baseline" }).click()
    await page.waitForTimeout(300)
    const f2 = await footer()
    await page.getByRole("button", { name: "Clear baseline" }).click()
    await page.waitForTimeout(300)
    const confirm2 = await page.getByRole("alertdialog").count()
    if (confirm2) await page.getByRole("alertdialog").getByRole("button", { name: "Clear baseline" }).click()
    await page.waitForTimeout(300)
    const gone = (await page.getByRole("button", { name: "Clear baseline" }).count()) === 0
    return /\+6 working days/.test(f1)
      ? note(`Variance shown (${/Finish vs baseline [^L]+/.exec(f1)?.[0]}). Re-baseline asks confirmation=${Boolean(confirm1)} (after: ${/Finish vs baseline [^L]+/.exec(f2)?.[0]}); Clear baseline asks confirmation=${Boolean(confirm2)}, cleared immediately=${gone}; no toast/undo on clear`)
      : bug(`Variance missing: ${f1}`)
  })

  // no delete / rename
  await check("SCHED-NO-DELETE-RENAME", async () => {
    await page.locator("tr", { hasText: "Decimal" }).first().click().catch(() => {})
    await page.locator("tr", { hasText: "Framing" }).first().click({ button: "right" }).catch(() => {})
    const btns = await page.locator("#app-main").getByRole("button").allInnerTexts()
    const menu = await page.getByRole("menu").count()
    const has = btns.some((t) => /delete|remove|rename|move|indent/i.test(t)) || menu
    return has ? "Controls exist" : bug("Schedule has no UI to delete, rename, move or reorder an activity or summary once added (store has deleteScheduleNode but nothing calls it); a mistaken or duplicate activity is permanent short of deleting its whole BOQ phase")
  })

  await check("SCHED-RENAME-DELETE-FLOW", async () => {
    await addNode("leaf", /Bravo/, "QA Temp", 1)
    const toolbar = (name) => page.locator("#app-main").getByRole("button", { name, exact: true })
    await page.locator("tr", { hasText: "QA Temp" }).first().getByRole("button", { name: /QA Temp/ }).click()
    await toolbar("Rename").click()
    await page.locator("#rename-name").fill("  QA Temp Renamed  ")
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await page.waitForTimeout(300)
    const renamed = (await rowNames()).some((n) => /QA Temp Renamed$/.test(n.trim()))
    await toolbar("Delete").click()
    const asked = await page.getByRole("alertdialog").count()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
    await page.waitForTimeout(300)
    const gone = !(await rowNames()).some((n) => /QA Temp/.test(n))
    await page.reload()
    await page.waitForTimeout(600)
    const goneAfterReload = !(await rowNames()).some((n) => /QA Temp/.test(n))
    return renamed && asked && gone && goneAfterReload
      ? "Renamed, then deleted after confirmation; still gone after reload"
      : bug(`renamed=${renamed} confirmation=${Boolean(asked)} gone=${gone} goneAfterReload=${goneAfterReload}`)
  })

  // BOQ replace: retention / removal / rename
  await check("BOQ-REPLACE-RETAIN-REMOVE-RENAME", async () => {
    await page.getByRole("button", { name: "Set baseline" }).click()
    await page.waitForTimeout(200)
    await importBoq("A,Alpha Renamed,A.1,One,lot,1,100,100\nC,Charlie,C.1,Three,lot,1,300,300\nD,Delta,D.1,Four,lot,1,400,400")
    await page.goto(`${projUrl}/scheduling`)
    await page.waitForTimeout(500)
    const names = await rowNames()
    await snap("s03-after-boq-replace")
    const renamed = names.some((n) => /Alpha Renamed/.test(n))
    const kept = names.some((n) => /Excavation/.test(n))
    const removed = !names.some((n) => /Framing|Bravo|Shell/.test(n))
    const order = names.map((n) => n.split(" ")[0]).join(",")
    const f = await footer()
    return renamed && kept && removed
      ? note(`Retain/remove/rename OK. Row order: ${order}. Footer after phase removal: ${f.slice(0, 120)}`)
      : bug(`renamed=${renamed} kept=${kept} removed=${removed}; rows=${JSON.stringify(names)}`)
  })
  await check("BOQ-REPLACE-PHASE-ORDER", async () => {
    await importBoq("D,Delta,D.1,Four,lot,1,400,400\nA,Alpha Renamed,A.1,One,lot,1,100,100\nC,Charlie,C.1,Three,lot,1,300,300")
    const boqOrder = (await page.locator("tbody tr", { hasText: /^Part / }).allInnerTexts()).map((t) => t.slice(5, 6)).join(",")
    await page.goto(`${projUrl}/scheduling`)
    await page.waitForTimeout(400)
    const roots = (await rowNames()).filter((n) => /LOCKED/.test(n)).map((n) => n[0]).join(",")
    return boqOrder === roots ? `Order matches ${roots}` : bug(`After re-ordering phases in the CSV the BOQ tab shows ${boqOrder} but Scheduling still lists phase roots as ${roots}`)
  })

  // CSV export
  await check("SCHED-CSV-EXPORT-CONTENT", async () => {
    await addNode("leaf", /Delta/, '=HYPERLINK("http://x","click")', 3)
    await addNode("leaf", /Delta/, 'Quote "and", comma', 1)
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export CSV" }).click()])
    const file = path.join(OUT, "evidence", "s03-schedule-export.csv")
    await dl.saveAs(file)
    const csv = fs.readFileSync(file, "utf8")
    const lines = csv.trim().split("\r\n")
    const formula = lines.find((l) => l.includes("HYPERLINK")) || ""
    const formulaCell = /,("?)(=HYPERLINK)/.test(formula)
    const quoted = lines.some((l) => l.includes('"Quote ""and"", comma"'))
    return formulaCell
      ? bug(`Export writes activity names starting with "=" unescaped (CSV/formula injection when opened in Excel): ${formula.slice(0, 90)}. Quote/comma escaping correct=${quoted}. File name: ${dl.suggestedFilename()}`)
      : `Escaped. ${formula}`
  })
  await check("SCHED-HUGE-DURATION-PERF", async () => {
    const t0 = Date.now()
    await durInput("Excavation").fill("200000")
    await durInput("Excavation").press("Enter")
    let hung = false
    try {
      // A baseline adds a second "working days" text to the footer.
      await page.locator("footer").last().getByText(/working days/).first().waitFor({ timeout: 15000 })
      await page.evaluate(() => 1)
    } catch {
      hung = true
    }
    const ms = Date.now() - t0
    const cells = await page.locator("thead span").count().catch(() => -1)
    await snap("s03-huge-duration").catch(() => {})
    return hung || ms > 5000 || cells > 5000
      ? bug(`Entering duration 200000 took ${ms} ms (hung=${hung}); Gantt axis rendered ${cells} week cells — no upper bound on duration`)
      : note(`Duration 200000 handled in ${ms} ms, ${cells} axis cells`)
  })
  await check("SCHED-RELOAD-PERSIST", async () => {
    await durInput("Excavation").fill("5").catch(() => {})
    await durInput("Excavation").press("Enter").catch(() => {})
    await page.reload()
    await page.waitForTimeout(800)
    const names = await rowNames()
    return names.some((n) => /Excavation/.test(n)) ? "Schedule persists across reload (localStorage)" : bug("Lost after reload")
  })

  // Clearwater: Fix network wipes edits
  await check("SCHED-FIX-NETWORK-WIPES-EDITS", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/scheduling`)
    await page.waitForTimeout(500)
    await addNode("leaf", /^A /, "QA Marker Activity", 2)
    await page.getByRole("button", { name: "Simulate cycle" }).click()
    await page.getByRole("button", { name: "Fix network" }).click()
    await page.waitForTimeout(500)
    if (await page.getByRole("alertdialog").count()) {
      await page.getByRole("alertdialog").getByRole("button", { name: "Fix network" }).click()
      return "Fix network asks for confirmation and names what is lost"
    }
    const still = (await rowNames()).some((n) => /QA Marker Activity/.test(n))
    return still ? "Edits preserved" : bug('"Fix network" restores the entire seed schedule: an activity added before the cycle was silently deleted, with no confirmation')
  })
  await check("SCHED-LOE-ROW", async () => {
    const row = page.locator("tr", { hasText: "Supervision (LOE)" }).first()
    const cells = (await row.locator("td").allInnerTexts()).slice(0, 6).map((t) => t.trim())
    return note(`Seed LOE row cells (name,dur,pred,ES,EF,TF): ${JSON.stringify(cells)}`)
  })
  await check("SCHED-CRITICAL-ONLY-AND-COLLAPSE", async () => {
    const all = (await rowNames()).length
    await page.getByRole("button", { name: "Critical only" }).click()
    const crit = (await rowNames()).length
    await page.getByRole("button", { name: "Critical only" }).click()
    await page.getByRole("button", { name: /^Toggle A / }).first().click()
    const collapsed = (await rowNames()).length
    await page.reload()
    await page.waitForTimeout(600)
    const afterReload = (await rowNames()).length
    return note(`rows all=${all} criticalOnly=${crit} collapsedA=${collapsed} afterReload=${afterReload}`)
  })

  await q.browser.close()
  fs.writeFileSync(path.join(OUT, "errors-s03.json"), JSON.stringify(errors, null, 2))
  console.log("errors:", errors.length, JSON.stringify(errors.slice(0, 6)))
})()
