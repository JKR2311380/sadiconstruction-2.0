import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

export function FaqAccordion({ items }) {
  const [open, setOpen] = useState(items[0]?.q ?? null)

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const active = open === item.q
        return (
          <div key={item.q} className="neu-out overflow-hidden rounded-2xl">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium"
              aria-expanded={active}
              onClick={() => setOpen(active ? null : item.q)}
            >
              {item.q}
              <ChevronDown className={active ? "rotate-180 transition" : "transition"} />
            </button>
            <AnimatePresence initial={false}>
              {active ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
