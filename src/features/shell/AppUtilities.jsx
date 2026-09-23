import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import gsap from "gsap"
import { ArrowUp, HelpCircle, Mail, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/CopyButton"
import { FaqAccordion } from "@/components/FaqAccordion"

export function SkipToContent() {
  return (
    <a className="skip-link no-print" href="#app-main">
      Skip to content
    </a>
  )
}

export function ScrollProgress({ targetRef }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const node = targetRef?.current
    function update() {
      const el = targetRef?.current
      if (el) {
        const max = el.scrollHeight - el.clientHeight
        setProgress(max <= 0 ? 0 : el.scrollTop / max)
        return
      }
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max <= 0 ? 0 : window.scrollY / max)
    }
    update()
    node?.addEventListener("scroll", update, { passive: true })
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      node?.removeEventListener("scroll", update)
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [targetRef])

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full origin-left bg-primary transition-[width] duration-75"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  )
}

export function ScrollToTop({ targetRef }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function update() {
      const el = targetRef?.current
      const y = el ? el.scrollTop : window.scrollY
      setShow(y > 360)
    }
    update()
    const el = targetRef?.current
    el?.addEventListener("scroll", update, { passive: true })
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      el?.removeEventListener("scroll", update)
      window.removeEventListener("scroll", update)
    }
  }, [targetRef])

  function jump() {
    const el = targetRef?.current
    if (el) el.scrollTo({ top: 0, behavior: "smooth" })
    else window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <AnimatePresence>
      {show ? (
        <motion.button
          type="button"
          aria-label="Scroll to top"
          className="neu-btn no-print fixed right-5 bottom-24 z-40 grid size-12 place-items-center rounded-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={jump}
        >
          <ArrowUp />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const fabRef = useRef(null)

  useEffect(() => {
    const el = fabRef.current
    if (!el) return undefined
    const press = () => gsap.to(el, { scale: 0.92, duration: 0.12, ease: "power2.out" })
    const release = () => gsap.to(el, { scale: 1, duration: 0.22, ease: "power3.out" })
    el.addEventListener("pointerdown", press)
    el.addEventListener("pointerup", release)
    el.addEventListener("pointerleave", release)
    return () => {
      el.removeEventListener("pointerdown", press)
      el.removeEventListener("pointerup", release)
      el.removeEventListener("pointerleave", release)
    }
  }, [])

  return (
    <div className="no-print fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="neu-out w-[min(26rem,calc(100vw-2.5rem))] rounded-[1.4rem] p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Workspace help</h2>
                <p className="text-xs text-muted-foreground">
                  Internal staff only. Copy a contact or read the FAQs.
                </p>
              </div>
              <Button type="button" size="icon-xs" variant="ghost" onClick={() => setOpen(false)}>
                <X />
                <span className="sr-only">Close help</span>
              </Button>
            </div>
            <div className="mb-3 flex items-center justify-between gap-2 rounded-[1rem] px-3 py-2 neu-in">
              <span className="flex items-center gap-2 text-sm">
                <Mail />
                admin@sadicon.local
              </span>
              <CopyButton value="admin@sadicon.local" label="Copy email" />
            </div>
            <FaqAccordion
              items={[
                {
                  q: "Who can change Staff Member roles?",
                  a: "Only Admin. The last Admin cannot be demoted from Settings.",
                },
                {
                  q: "Why can’t I edit the BOQ in Scheduling?",
                  a: "The approved BOQ owns Phase Roots. Replace the BOQ from the BOQ tab; the network seeds from that.",
                },
              ]}
            />
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => {
                setOpen(false)
                navigate("/settings#faq")
              }}
            >
              Full FAQ in Settings
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        ref={fabRef}
        type="button"
        className="neu-btn-primary grid size-14 place-items-center rounded-full"
        aria-expanded={open}
        aria-label="Open workspace help"
        onClick={() => setOpen((current) => !current)}
      >
        <HelpCircle />
      </button>
    </div>
  )
}
