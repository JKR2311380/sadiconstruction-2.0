// Scenario 08 — mock build: landing page links/CTAs, mobile drawer retest, misc shell checks.
const { open, bug, note } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5181"
;(async () => {
  let q = await open(BASE)
  let { page, check, snap, errors } = q
  await check("LANDING-LINKS", async () => {
    await page.goto(BASE)
    await page.waitForTimeout(2500)
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("a")].map((a) => ({ text: a.innerText.trim().replace(/\s+/g, " ").slice(0, 40), href: a.getAttribute("href") })),
    )
    const bad = []
    for (const l of links) {
      if (!l.href || l.href === "#") bad.push(`${l.text || "(no text)"} → "${l.href}"`)
      else if (l.href.startsWith("#")) {
        const ok = await page.evaluate((id) => Boolean(document.getElementById(id)), l.href.slice(1))
        if (!ok) bad.push(`${l.text} → ${l.href} (no element with that id)`)
      } else if (l.href.startsWith("/")) {
        if (!["/", "/login", "/signup", "/projects", "/settings"].includes(l.href.split(/[?#]/)[0])) bad.push(`${l.text} → ${l.href} (no such route)`)
      }
    }
    const summary = `${links.length} links: ${[...new Set(links.map((l) => `${l.text}→${l.href}`))].join(" | ").slice(0, 700)}`
    return bad.length ? bug(`Broken landing links: ${bad.join("; ")} || ${summary}`) : note(summary)
  })
  await check("LANDING-BUTTONS-WITHOUT-ACTION", async () => {
    const btns = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.innerText.trim().replace(/\s+/g, " ").slice(0, 30) || b.getAttribute("aria-label") || "(unlabelled)"))
    return note(`${btns.length} buttons: ${btns.join(" | ").slice(0, 500)}`)
  })
  await check("LANDING-CONSOLE-ERRORS", async () => {
    await page.mouse.wheel(0, 6000)
    await page.waitForTimeout(1500)
    const errs = errors.filter((e) => e.type !== "http")
    return errs.length ? bug(`Landing page console/page errors: ${JSON.stringify(errs.slice(0, 4))}`) : "No console errors on landing"
  })
  await check("SHELL-CTRL-K", async () => {
    await q.login("planner@sadicon.local")
    const n = errors.length
    await page.keyboard.press("Control+k")
    await page.waitForTimeout(800)
    const dead = (await page.locator("#app-main").count()) === 0
    // QA-047: the palette must not advertise shortcuts that no key handler implements.
    if (!dead && (await page.getByRole("dialog").getByText(/^G [PS]$/).count())) return bug("Palette lists G P / G S shortcut hints that do nothing")
    return dead ? bug(`Ctrl+K blanks the application (${errors.slice(n).find((e) => e.type === "pageerror")?.message})`) : "ok"
  })
  await q.browser.close()

  q = await open(BASE, { viewport: { width: 390, height: 844 } })
  ;({ page, check, snap } = q)
  await q.login("planner@sadicon.local")
  await check("MOBILE-NAV-DRAWER-RETEST", async () => {
    await page.getByRole("button", { name: "Open navigation" }).click()
    await page.getByRole("link", { name: "Settings" }).click()
    await page.waitForURL(/settings/)
    await page.waitForTimeout(1200)
    const open = await page.getByRole("dialog").count()
    return open ? bug("Mobile navigation drawer stays open after choosing a destination") : "Drawer closes after navigating"
  })
  await check("MOBILE-BOQ-DIALOG-USABLE", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/boq`)
    await page.getByRole("button", { name: "Replace via CSV" }).click()
    await page.getByRole("button", { name: "Preview CSV" }).click()
    const btn = page.getByRole("button", { name: "Confirm replacement" })
    const box = await btn.boundingBox()
    await page.getByRole("button", { name: "Cancel" }).click()
    return box && box.y + box.height <= 844 && box.x >= 0 ? "Confirm reachable at 390px" : note(`Confirm button box ${JSON.stringify(box)}`)
  })
  await q.browser.close()
})()
