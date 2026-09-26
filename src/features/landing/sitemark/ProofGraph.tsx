import { useMemo, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { ACTIVITIES, computeNetwork } from "./network"

const TARGET = "E"
const MIN = 6
const MAX = 26
const BASE = ACTIVITIES.find((a) => a.id === TARGET)!.duration
const ORDER = ["A", "B", "H", "C", "D", "E", "F", "G", "I"]
const SCALE_DAYS = 96

export function ProofGraph() {
  const [days, setDays] = useState(BASE)
  const net = useMemo(() => computeNetwork({ [TARGET]: days }), [days])
  const rows = ORDER.map((id) => ACTIVITIES.find((a) => a.id === id)!)
  const target = rows.find((a) => a.id === TARGET)!
  const targetCritical = net.critical.has(TARGET)
  const pct = (d: number) => `${(d / SCALE_DAYS) * 100}%`

  const summary = targetCritical
    ? `${target.name} is now on the Longest Path. Handover moves to day ${net.duration}.`
    : `${target.name} has ${net.metrics[TARGET].totalFloat} days of float. Handover holds at day ${net.duration}.`

  return (
    <div className="sm-proof">
      <div className="sm-proof__control">
        <p className="sm-proof__label" id="sm-proof-label">
          {target.name} duration
        </p>
        <div className="sm-proof__stepper" role="group" aria-labelledby="sm-proof-label">
          <button
            type="button"
            onClick={() => setDays((d) => Math.max(MIN, d - 2))}
            disabled={days <= MIN}
            aria-label="Shorten by 2 days"
          >
            <Minus size={16} strokeWidth={2} aria-hidden />
          </button>
          <output className="sm-proof__value" aria-live="off">
            {days} d
          </output>
          <button
            type="button"
            onClick={() => setDays((d) => Math.min(MAX, d + 2))}
            disabled={days >= MAX}
            aria-label="Lengthen by 2 days"
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <p className="sm-proof__summary" aria-live="polite">
          {summary}
        </p>
        {days !== BASE && (
          <button type="button" className="sm-proof__reset" onClick={() => setDays(BASE)}>
            Reset to {BASE} d
          </button>
        )}
      </div>

      <div className="sm-proof__chart">
        <div className="sm-proof__plot" aria-hidden>
          {[0, 20, 40, 60, 80].map((d) => (
            <span key={d} className="sm-proof__tick" style={{ left: pct(d) }}>
              <span>{d}</span>
            </span>
          ))}
          <span className="sm-proof__handover" style={{ left: pct(net.duration) }}>
            <span>Handover, day {net.duration}</span>
          </span>
        </div>
        <ul className="sm-proof__rows">
          {rows.map((a) => {
            const m = net.metrics[a.id]
            const critical = net.critical.has(a.id)
            return (
              <li key={a.id} className="sm-proof__row" data-critical={critical || undefined} data-target={a.id === TARGET || undefined}>
                <span className="sm-proof__name">
                  <span className="sm-num">{a.code}</span> {a.name}
                </span>
                <span className="sm-proof__track">
                  <span
                    className="sm-proof__bar"
                    style={{ left: pct(m.es), width: pct(m.ef - m.es) }}
                    aria-label={`${a.name}: day ${m.es} to ${m.ef}${critical ? ", on the Longest Path" : `, ${m.totalFloat} days float`}`}
                    role="img"
                  />
                  {!critical && (m.totalFloat ?? 0) > 0 && (
                    <span
                      className="sm-proof__float"
                      style={{ left: pct(m.ef), width: pct(m.totalFloat ?? 0) }}
                      aria-hidden
                    />
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
