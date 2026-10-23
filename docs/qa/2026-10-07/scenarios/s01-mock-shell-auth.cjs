// Scenario 01 — mock build: auth, routing, shell, directory, overview, settings.
const { open, bug, note } = require("./lib.cjs")
const BASE = "http://127.0.0.1:5181"

;(async () => {
  const q = await open(BASE)
  const { page, check, snap, errors } = q
  const toast = (text) => page.getByText(text, { exact: false }).first()

  // ---------- routing while signed out ----------
  await check("ROUTE-UNKNOWN-SIGNED-OUT", async () => {
    await page.goto(`${BASE}/no-such-page`)
    await page.waitForTimeout(800)
    const url = new URL(page.url()).pathname
    return url === "/" ? note("Unknown URL silently redirects to landing; no 404 page") : bug(`landed on ${url}`)
  })
  await check("ROUTE-DEEPLINK-RETURN", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/scheduling`)
    await page.waitForURL(/\/login/)
    await page.locator("#email").fill("planner@sadicon.local")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForTimeout(1200)
    const url = new URL(page.url()).pathname
    return url === "/projects/prj-clearwater/scheduling" ? "Deep link restored after login" : bug(`After login landed on ${url}`)
  })
  await check("ROUTE-DEEPLINK-QUERY-LOST", async () => {
    await page.getByRole("button", { name: "Sign out" }).click()
    await page.waitForURL(/\/login/)
    await page.goto(`${BASE}/projects?new=1`)
    await page.waitForURL(/\/login/)
    await page.locator("#email").fill("planner@sadicon.local")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForTimeout(1200)
    const dialog = await page.getByRole("dialog").count()
    return dialog ? "Query string survived login redirect" : bug("?new=1 dropped by login redirect (only pathname is kept); Add Project dialog did not open")
  })

  // ---------- sign out / back button ----------
  await check("AUTH-SIGNOUT-BACK", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/overview`)
    await page.getByRole("button", { name: "Sign out" }).click()
    await page.waitForURL(/\/login/)
    await page.goBack()
    await page.waitForTimeout(800)
    const url = new URL(page.url()).pathname
    return url.startsWith("/login") ? "Back after sign-out stays on login" : bug(`Back after sign-out shows ${url}`)
  })

  // ---------- login validation ----------
  await check("AUTH-LOGIN-WRONG-PASSWORD", async () => {
    await page.goto(`${BASE}/login`)
    await page.locator("#email").fill("planner@sadicon.local")
    await page.locator("#password").fill("wrongpass")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await toast("not recognized").waitFor()
    return "Wrong password rejected with message"
  })
  await check("AUTH-LOGIN-EMAIL-CASE-SPACE", async () => {
    await page.locator("#email").fill("PLANNER@sadicon.local")
    await page.locator("#password").fill("demo123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForURL(/\/projects/, { timeout: 4000 })
    return "Upper-case email accepted"
  })
  await check("AUTH-LOGIN-PREFILLED", async () => {
    await page.getByRole("button", { name: "Sign out" }).click()
    await page.waitForURL(/\/login/)
    const email = await page.locator("#email").inputValue()
    const pass = await page.locator("#password").inputValue()
    const list = await page.getByText("Seeded Staff Members").count()
    return note(`Login form prefilled email="${email}" password length=${pass.length}; seeded credentials panel visible=${Boolean(list)}`)
  })

  // ---------- signup ----------
  await check("AUTH-SIGNUP-WHITESPACE-NAME", async () => {
    await page.goto(`${BASE}/signup`)
    await page.locator("#fullName").fill("   ")
    await page.locator("#signup-email").fill("ws@qa.test")
    await page.locator("#signup-password").fill("secret1")
    await page.getByRole("button", { name: "Sign up", exact: true }).click()
    await toast("Enter a full name").waitFor({ timeout: 3000 })
    return "Whitespace-only name rejected"
  })
  await check("AUTH-SIGNUP-SHORT-PASSWORD-SPACES", async () => {
    await page.locator("#fullName").fill("QA Person")
    await page.locator("#signup-password").fill("      ")
    await page.getByRole("button", { name: "Sign up", exact: true }).click()
    await page.waitForTimeout(1000)
    const created = await page.getByText("Account created").count()
    return created ? bug("Password of six spaces accepted") : "rejected"
  })
  await check("AUTH-SIGNUP-DIALOG-DISMISS", async () => {
    // fresh context state: sign out if signed in
    await page.goto(`${BASE}/projects`)
    if (new URL(page.url()).pathname === "/projects") {
      await page.getByRole("button", { name: "Sign out" }).click()
      await page.waitForURL(/\/login/)
    }
    await page.goto(`${BASE}/signup`)
    await page.locator("#fullName").fill("QA Dismiss")
    await page.locator("#signup-email").fill("dismiss@qa.test")
    await page.locator("#signup-password").fill("secret1")
    await page.getByRole("button", { name: "Sign up", exact: true }).click()
    await page.getByText("Account created").waitFor()
    await page.keyboard.press("Escape")
    await page.waitForTimeout(1000)
    const url = new URL(page.url()).pathname
    return url === "/projects" ? "Escape on success dialog continues to projects" : note(`After Escape on success dialog URL=${url}`)
  })
  await check("AUTH-SIGNUP-RELOGIN", async () => {
    await page.goto(`${BASE}/projects`)
    await page.getByRole("button", { name: "Sign out" }).click()
    await page.waitForURL(/\/login/)
    await page.locator("#email").fill("dismiss@qa.test")
    await page.locator("#password").fill("secret1")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()
    await page.waitForURL(/\/projects/, { timeout: 4000 })
    return "New mock account can sign in again"
  })
  await check("AUTH-LOGIN-PAGE-WHEN-SIGNED-IN", async () => {
    await page.goto(`${BASE}/login`)
    await page.waitForTimeout(600)
    const a = new URL(page.url()).pathname
    await page.goto(`${BASE}/signup`)
    await page.waitForTimeout(600)
    const b = new URL(page.url()).pathname
    return a === "/projects" && b === "/projects" ? "Signed-in user redirected away from login/signup" : bug(`login->${a} signup->${b}`)
  })

  // ---------- shell ----------
  await page.getByRole("button", { name: "Sign out" }).click()
  await page.waitForURL(/\/login/)
  await q.login("admin@sadicon.local")

  await check("SHELL-COMMAND-PALETTE", async () => {
    const before = errors.length
    await page.getByRole("button", { name: /Search workspace/ }).click()
    await page.waitForTimeout(800)
    const blank = (await page.locator("#app-main").count()) === 0
    const err = errors.slice(before).find((e) => e.type === "pageerror")
    if (blank || err) {
      await snap("s01-command-palette-crash")
      return bug(`Command palette crashes app: ${err?.message}; app shell unmounted=${blank}`)
    }
    return "Palette opened"
  })
  await page.goto(`${BASE}/projects`)
  await check("SHELL-NAV-ACTIVE-AND-LINKS", async () => {
    await page.getByRole("link", { name: "Settings" }).click()
    await page.waitForURL(/\/settings/)
    await page.getByRole("link", { name: "Projects" }).click()
    await page.waitForURL(/\/projects$/)
    return "Rail links navigate"
  })
  await check("SHELL-HELP-FAQ-LINK-FROM-PROJECTS", async () => {
    await page.getByRole("button", { name: "Open workspace help" }).click()
    await page.getByRole("button", { name: "Full FAQ in Settings" }).click()
    await page.waitForURL(/\/settings#faq/)
    await page.waitForTimeout(1200)
    const inView = await page.locator("#faq").evaluate((el) => {
      const r = el.getBoundingClientRect()
      return r.top >= 0 && r.top < window.innerHeight
    })
    return inView ? "FAQ scrolled into view" : bug("Navigated to /settings#faq but FAQ section is not in view")
  })
  await check("SHELL-HELP-FAQ-LINK-FROM-SETTINGS", async () => {
    await page.goto(`${BASE}/settings`)
    await page.setViewportSize({ width: 1440, height: 500 })
    await page.waitForTimeout(400)
    await page.getByRole("button", { name: "Open workspace help" }).click()
    await page.getByRole("button", { name: "Full FAQ in Settings" }).click()
    await page.waitForTimeout(1200)
    const top = await page.locator("#faq").evaluate((el) => el.getBoundingClientRect().top)
    const vh = 500
    await page.setViewportSize({ width: 1440, height: 1000 })
    return top >= 0 && top < vh ? "FAQ scrolled into view" : bug(`"Full FAQ in Settings" does nothing when already on Settings (FAQ top=${Math.round(top)}px, viewport 500px)`)
  })
  await check("SHELL-HELP-COPY-EMAIL", async () => {
    await page.goto(`${BASE}/projects`)
    await q.context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.getByRole("button", { name: "Open workspace help" }).click()
    await page.getByRole("button", { name: /Copy email/ }).click()
    await page.waitForTimeout(300)
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    await page.getByRole("button", { name: "Close help" }).click()
    return clip === "admin@sadicon.local" ? "Copied" : bug(`clipboard="${clip}"`)
  })
  await check("SHELL-THEME-PERSIST", async () => {
    await page.getByRole("button", { name: "Switch to dark mode" }).click()
    await page.reload()
    await page.waitForTimeout(500)
    const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"))
    await page.getByRole("button", { name: /Switch to light mode/ }).click()
    return dark ? "Dark theme persists" : bug("Theme not persisted")
  })

  // ---------- directory ----------
  await check("DIR-CREATE-WHITESPACE-NAME", async () => {
    await page.goto(`${BASE}/projects`)
    await page.getByRole("button", { name: "Add Project" }).click()
    await page.locator("#proj-name").fill("   ")
    await page.getByRole("button", { name: "Create" }).click()
    await page.waitForTimeout(800)
    const url = new URL(page.url()).pathname
    if (/\/projects\/prj-/.test(url)) {
      await snap("s01-whitespace-project")
      return bug("Whitespace-only project name accepted; project created with blank heading")
    }
    return "rejected"
  })
  await check("DIR-CREATE-DOUBLE-SUBMIT", async () => {
    await page.goto(`${BASE}/projects`)
    const before = await page.locator("tbody tr").count()
    await page.getByRole("button", { name: "Add Project" }).click()
    await page.locator("#proj-name").fill("QA Double Submit")
    await page.locator("#proj-name").press("Enter")
    await page.locator("#proj-name").press("Enter").catch(() => {})
    await page.waitForTimeout(800)
    await page.goto(`${BASE}/projects`)
    const rows = await page.locator("tbody tr", { hasText: "QA Double Submit" }).count()
    return rows === 1 ? `One project created (rows before ${before})` : bug(`${rows} projects created from a double Enter`)
  })
  await check("DIR-CREATE-LONG-NAME", async () => {
    await page.getByRole("button", { name: "Add Project" }).click()
    await page.locator("#proj-name").fill("L".repeat(600))
    await page.getByRole("button", { name: "Create" }).click()
    await page.waitForTimeout(800)
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
    return note(`600-char project name accepted (no length limit); page horizontal overflow=${over}`)
  })
  await check("DIR-NEW-PROJECT-DEFAULTS", async () => {
    await page.goto(`${BASE}/projects`)
    await page.locator("tbody tr", { hasText: "QA Double Submit" }).first().click()
    await page.waitForURL(/overview/)
    const text = await page.locator("#app-main").innerText()
    await snap("s01-new-project-overview")
    const sub = text.split("\n").find((l) => l.includes("PRJ-")) || ""
    return note(`New project subtitle: "${sub}" | Budget card: ${/Budget\s*\n\s*([^\n]+)/.exec(text)?.[1]} | finish: ${/Critical path finish\s*\n\s*([^\n]+)/.exec(text)?.[1]}`)
  })
  await check("DIR-NO-EDIT-ARCHIVE-STAGE-UI", async () => {
    const main = page.locator("#app-main")
    const controls = await main.getByRole("button").allInnerTexts()
    const hasEdit = controls.some((t) => /edit|archive|delete|stage|rename/i.test(t))
    return hasEdit ? "Edit controls present" : bug(`Project page offers no way to edit name/client/stage/priority/budget/start date or archive the project. Buttons present: ${controls.join(" | ")}`)
  })
  await check("DIR-EDIT-DETAILS-AND-ARCHIVE", async () => {
    await page.goto(`${BASE}/projects`)
    await page.getByRole("button", { name: "Add Project" }).click()
    await page.locator("#proj-name").fill("QA Editor Target")
    await page.getByRole("button", { name: "Create" }).click()
    await page.waitForURL(/overview/)
    const url = page.url()
    await page.getByRole("button", { name: "Edit details" }).click()
    await page.locator("#edit-name").fill("  QA Edited  ")
    await page.locator("#edit-budget").fill("1000")
    await page.locator("#edit-start").fill("2026-11-02")
    await page.locator("#edit-end").fill("2026-10-01")
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    const rejected = await page.getByRole("alert").filter({ hasText: /before the start date/ }).count()
    await page.locator("#edit-end").fill("2027-03-31")
    await page.getByRole("combobox", { name: "Stage" }).click()
    await page.getByRole("option", { name: "Active", exact: true }).click()
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await page.waitForTimeout(400)
    await page.reload()
    await page.waitForTimeout(500)
    const text = await page.locator("#app-main").innerText()
    const saved = /QA Edited/.test(text) && /^active$/im.test(text) && /1,000/.test(text)
    // archive
    await page.getByRole("button", { name: "Edit details" }).click()
    await page.getByRole("button", { name: "Archive project" }).click()
    const asked = await page.getByRole("alertdialog").count()
    await page.getByRole("alertdialog").getByRole("button", { name: "Archive project" }).click()
    await page.waitForURL(/\/projects$/)
    const listed = await page.locator("tbody tr", { hasText: "QA Edited" }).count()
    await page.goto(url)
    await page.waitForTimeout(400)
    const reachable = /overview/.test(page.url())
    return rejected && saved && asked && !listed && !reachable
      ? "Details edited and persisted; reversed dates rejected; archive confirmed and removes the project"
      : bug(`reversedDatesRejected=${Boolean(rejected)} saved=${saved} archiveConfirm=${Boolean(asked)} stillListed=${listed} stillReachable=${reachable}`)
  })
  await check("DIR-SEARCH-FILTER", async () => {
    await page.goto(`${BASE}/projects`)
    await page.getByPlaceholder("Search projects…").fill("harbor")
    const n = await page.locator("tbody tr").count()
    await page.getByRole("button", { name: "Delayed" }).click()
    await page.waitForTimeout(200)
    const empty = await page.getByText("No projects match").count()
    await page.getByPlaceholder("Search projects…").fill("")
    await page.getByRole("button", { name: "All", exact: true }).click()
    return n === 1 && empty === 1 ? "Search + stage filter combine" : bug(`search rows=${n} empty=${empty}`)
  })
  await check("DIR-ROW-KEYBOARD-ACCESS", async () => {
    const row = page.locator("tbody tr").first()
    const tabindex = await row.getAttribute("tabindex")
    const links = await row.locator("a, button").count()
    return tabindex != null || links > 0 ? "Row is keyboard reachable" : bug("Project rows are click-only <tr> (no link/button/tabindex) — a keyboard user cannot open a project from the directory")
  })
  await check("DIR-SORT-CONTROLS", async () => {
    const sortable = await page.locator("thead button, thead [aria-sort]").count()
    return sortable ? "Sortable headers" : note("Directory has no sort controls (name/stage/priority/progress)")
  })

  // ---------- project routing ----------
  await check("PROJ-INVALID-ID", async () => {
    await page.goto(`${BASE}/projects/does-not-exist/overview`)
    await page.waitForTimeout(700)
    const url = new URL(page.url()).pathname
    const msg = await page.getByText(/not found|no longer|does not exist/i).count()
    return msg ? "Message shown" : note(`Unknown project id redirects to ${url} with no explanation`)
  })
  await check("PROJ-INVALID-TAB", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/bogus`)
    await page.waitForTimeout(600)
    const sel = await page.getByRole("tab", { selected: true }).innerText()
    return note(`/projects/:id/bogus renders tab "${sel}" while URL stays ${new URL(page.url()).pathname}`)
  })
  await check("PROJ-TAB-BACK-BUTTON", async () => {
    await page.goto(`${BASE}/projects`)
    await page.locator("tbody tr", { hasText: "Clearwater" }).click()
    await page.getByRole("tab", { name: "Documents" }).click()
    await page.getByRole("tab", { name: "Bill of Quantities" }).click()
    await page.goBack()
    await page.waitForTimeout(400)
    const sel = await page.getByRole("tab", { selected: true }).innerText()
    return sel === "Documents" ? "Browser back moves between tabs" : bug(`Back selected ${sel}`)
  })

  // ---------- overview data ----------
  await check("OVERVIEW-CLEARWATER", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/overview`)
    const text = await page.locator("#app-main").innerText()
    await snap("s01-clearwater-overview")
    const complete = /Schedule complete\s*\n\s*([^\n]+)/.exec(text)?.[1]
    await page.goto(`${BASE}/projects`)
    const row = await page.locator("tbody tr", { hasText: "Clearwater" }).innerText()
    const dirPct = /\t(\d+)%/.exec(row)?.[1]
    return String(complete) === `${dirPct}%`
      ? `Progress consistent ${complete}`
      : bug(`Directory progress ${dirPct}% vs Overview "Schedule complete" ${complete} for the same project`)
  })
  await check("OVERVIEW-CRITICAL-LINK", async () => {
    await page.goto(`${BASE}/projects/prj-clearwater/overview`)
    const link = page.locator("section", { hasText: "Upcoming critical activities" }).getByRole("link").first()
    const name = await link.innerText()
    await link.click()
    await page.waitForURL(/scheduling/)
    await page.waitForTimeout(500)
    const selected = await page.locator('tr[data-selected="true"]').count()
    return selected ? `Critical activity "${name}" selected in schedule` : bug(`Clicking "${name}" did not select a schedule row`)
  })

  // ---------- settings ----------
  await check("SETTINGS-ROLE-CHANGE-AND-LAST-ADMIN", async () => {
    await page.goto(`${BASE}/settings`)
    const sel = page.getByLabel("Role for admin@sadicon.local")
    await sel.selectOption("planner")
    await toast("Cannot demote the last Admin").waitFor()
    const v = await sel.inputValue()
    return v === "admin" ? "Last admin protected; select reverted" : bug(`select shows ${v}`)
  })
  await check("SETTINGS-SELF-DEMOTE-WITH-TWO-ADMINS", async () => {
    await page.getByLabel("Role for planner@sadicon.local").selectOption("admin")
    await toast("Role set to Admin").waitFor()
    await page.getByLabel("Role for admin@sadicon.local").selectOption("planner")
    await page.waitForTimeout(600)
    if (await page.getByRole("alertdialog").count()) {
      const stillAdmin = (await page.getByLabel("Role for admin@sadicon.local").inputValue()) === "admin"
      await page.getByRole("alertdialog").getByRole("button", { name: "Make me a Planner" }).click()
      await page.waitForTimeout(600)
      const notice = await page.getByText("Changing Staff Member Roles is Admin-only").count()
      return stillAdmin && notice ? "Self-demotion asks for confirmation, then applies" : bug(`confirm shown but stillAdminBefore=${stillAdmin} demotedAfter=${Boolean(notice)}`)
    }
    const table = await page.getByLabel("Role for planner@sadicon.local").count()
    const txt = await page.getByText("Changing Staff Member Roles is Admin-only").count()
    return note(`Admin can demote self with no confirmation; role table still visible=${Boolean(table)}; admin-only notice=${Boolean(txt)}`)
  })
  await check("SETTINGS-STALE-ROLE-OTHER-SESSION", async () => {
    // A second tab signed in as the (now promoted) planner account keeps its old role until re-login.
    const p2 = await q.context.newPage()
    await p2.goto(`${BASE}/settings`)
    await p2.waitForTimeout(600)
    const body = await p2.locator("#app-main").innerText()
    await p2.close()
    return note(`Second tab after self-demotion shows: ${/Signed in as[^\n]+/.exec(body)?.[0] || "role table"}`)
  })
  await check("SETTINGS-RESET-DEMO", async () => {
    await page.getByRole("button", { name: "Reset demo data", exact: true }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo data" }).click()
    await toast("Demo data restored").waitFor()
    await page.goto(`${BASE}/projects`)
    const qa = await page.locator("tbody tr", { hasText: "QA Double Submit" }).count()
    const staffRaw = await page.evaluate(() => localStorage.getItem("sadicon-mock-staff"))
    return qa === 0
      ? note(`Projects reset. Mock staff list NOT reset (still stored: ${staffRaw ? JSON.parse(staffRaw).map((s) => `${s.email}:${s.role}`).join(", ") : "none"})`)
      : bug("QA project survived reset")
  })

  await q.browser.close()
  require("node:fs").writeFileSync(require("node:path").join(require("./lib.cjs").OUT, "errors-s01.json"), JSON.stringify(errors, null, 2))
  console.log("errors:", errors.length)
})()
