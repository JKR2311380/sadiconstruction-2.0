import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ClearwaterMassing } from "./features/landing/ClearwaterMassing"
import "./landing-layout.css"

gsap.registerPlugin(ScrollTrigger)

const BEATS = [
  {
    code: "A1100",
    side: "left",
    title: "Cost owns the programme.",
    body: "Sadiconstruction schedules on the same WBS as the approved BOQ. Phases are locked. Time never invents billable work.",
  },
  {
    code: "A1180",
    side: "left",
    title: "The path is computed here.",
    body: "A first-party CPM engine runs topological sort, float, and Longest Path in the browser — not a desktop export you have to trust.",
  },
  {
    code: "A1180",
    side: "left",
    title: "Only the driving work may close the form.",
    body: "Non-critical volumes wait. The vermilion spine is the work that cannot slip. That is what a PM puts on a meeting screen.",
  },
  {
    code: "A1240",
    side: "right",
    title: "Then the product, in full.",
    body: "An internal construction OS: projects, a view-only BOQ, and a first-party CPM engine. Planners evaluate time risk on the phases already approved in cost.",
  },
]

const WEEKS = ["W12", "W14", "W16", "W18", "W20", "W22", "W24", "W26", "W28"]

function weekAt(progress) {
  const i = Math.min(WEEKS.length - 1, Math.floor(progress * WEEKS.length))
  return WEEKS[i]
}

export default function LandingPage() {
  const pinRef = useRef(null)
  const progressRef = useRef(0)
  const fillRef = useRef(null)
  const beatIndexRef = useRef(0)
  const [beatIndex, setBeatIndex] = useState(0)
  const [week, setWeek] = useState(WEEKS[0])
  const [reduced, setReduced] = useState(false)
  const [modalOpen, setModalOpen] = useState(true)
  const beat = BEATS[beatIndex]

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncReduce = () => setReduced(media.matches)
    syncReduce()
    media.addEventListener("change", syncReduce)

    if (media.matches) {
      progressRef.current = 1
      setBeatIndex(BEATS.length - 1)
      setWeek(WEEKS[WEEKS.length - 1])
      if (fillRef.current) fillRef.current.style.height = "100%"
      return () => media.removeEventListener("change", syncReduce)
    }

    const trigger = ScrollTrigger.create({
      trigger: pinRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progressRef.current = self.progress
        if (fillRef.current) {
          fillRef.current.style.height = `${Math.max(6, self.progress * 100)}%`
        }
        const nextBeat = Math.min(BEATS.length - 1, Math.floor(self.progress * 0.999 * BEATS.length))
        if (beatIndexRef.current !== nextBeat) {
          beatIndexRef.current = nextBeat
          setBeatIndex(nextBeat)
          setModalOpen(true)
        }
        const nextWeek = weekAt(self.progress)
        setWeek((w) => (w === nextWeek ? w : nextWeek))
      },
    })

    return () => {
      trigger.kill()
      media.removeEventListener("change", syncReduce)
    }
  }, [])

  return (
    <div className="landing-4d">
      <div ref={pinRef} className="seq-chapter">
        <div className="seq-sticky">
          <header className="seq-top">
            <p className="seq-wordmark">Sadiconstruction</p>
            <p className="seq-meta">Clearwater Medical Center · PRJ-2024-008 · Synthetic</p>
          </header>

          <div className="seq-stage">
            <ClearwaterMassing progressRef={progressRef} reduced={reduced} />

            {modalOpen ? (
              <aside
                key={beatIndex}
                className={`seq-modal seq-modal--${beat.side}`}
                role="dialog"
                aria-modal="false"
                aria-live="polite"
                aria-labelledby="seq-modal-title"
                aria-describedby="seq-modal-body"
              >
                <button
                  type="button"
                  className="seq-modal__close"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close product brief"
                >
                  Close
                </button>
                <p className="seq-modal__code">{beat.code}</p>
                <h1 id="seq-modal-title">{beat.title}</h1>
                <p id="seq-modal-body">{beat.body}</p>
                {beatIndex === BEATS.length - 1 ? (
                  <div className="seq-modal__actions">
                    <Link className="btn-try" to="/request-access">
                      Try now
                    </Link>
                    <Link className="btn-ghost" to="/login">
                      Sign in
                    </Link>
                  </div>
                ) : null}
                <span className="seq-modal__leader" aria-hidden="true" />
              </aside>
            ) : (
              <button
                type="button"
                className={`seq-modal-reopen seq-modal-reopen--${beat.side}`}
                onClick={() => setModalOpen(true)}
              >
                Open brief · {beat.code}
              </button>
            )}
          </div>

          <div className="seq-progress" role="status" aria-label="Programme progress">
            <span className="seq-progress__week">{week}</span>
            <div className="seq-progress__rail" aria-hidden="true">
              <i ref={fillRef} />
            </div>
            <span className="seq-progress__end">W28</span>
          </div>
        </div>
      </div>

      <section className="market" id="product">
        <header className="market-top">
          <p className="seq-wordmark">Sadiconstruction</p>
          <div className="market-actions">
            <Link className="btn-ghost" to="/login">
              Sign in
            </Link>
            <Link className="btn-try" to="/request-access">
              Try now
            </Link>
          </div>
        </header>

        <div className="market-hero">
          <h2>Schedule on the same WBS as cost.</h2>
          <p>
            An internal construction OS: projects, a view-only BOQ, and a first-party CPM engine.
            Planners evaluate time risk on the phases already approved in cost.
          </p>
        </div>

        <ul className="market-features">
          <li>
            <h3>Locked phases</h3>
            <p>BOQ phase roots are immutable. Nested summaries are allowed; inventing billable work is not.</p>
          </li>
          <li>
            <h3>Longest Path</h3>
            <p>Criticality is computed in-app from FS/SS/FF/SF logic. Driving work is the vermilion spine, not an imported flag.</p>
          </li>
          <li>
            <h3>Float, in the open</h3>
            <p>Total float sits next to every leaf. Near-critical work is visible before it becomes the path.</p>
          </li>
        </ul>

        <div className="market-about">
          <h2>Built for the progress meeting.</h2>
          <p>
            Sadiconstruction is for project planners and managers inside the org — not a public SaaS.
            The sequence above is synthetic demonstration data for Clearwater Medical Center.
            Request access if you should be on the distribution list.
          </p>
          <div className="market-actions market-actions--block">
            <Link className="btn-try" to="/request-access">
              Request access
            </Link>
            <Link className="btn-ghost" to="/login">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
