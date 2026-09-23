const BEATS = [
  {
    id: "bill",
    name: "The bill owns the floors.",
    body: "Phase roots are locked to the approved BOQ. Scheduling cannot invent a billable hole the cost book did not name.",
    object: (
      <div className="meeting-screen meeting-object" aria-hidden>
        <div className="meeting-row meeting-row-phase">
          <i className="meeting-swatch meeting-swatch-b" />
          <span>B – Site Works & Earthworks</span>
          <span className="meeting-lock">Locked</span>
        </div>
        <div className="meeting-row">
          <i className="meeting-swatch meeting-swatch-b" />
          <span>B.2 Excavation Works (Bulk)</span>
          <span className="meeting-mono">45d</span>
        </div>
      </div>
    ),
  },
  {
    id: "logic",
    name: "Logic cages the void.",
    body: "Finish-to-start, start-to-start, lag. Activities are the formwork. A free crew does not skip a locked phase.",
    object: (
      <div className="meeting-screen meeting-object" aria-hidden>
        <div className="meeting-row">
          <span className="meeting-mono">A.2</span>
          <span>Temporary Facilities</span>
          <span className="meeting-pred">A.1 FS</span>
        </div>
        <div className="meeting-row">
          <span className="meeting-mono">B.1</span>
          <span>Site Clearing</span>
          <span className="meeting-pred">A.2 FS</span>
        </div>
      </div>
    ),
  },
  {
    id: "path",
    name: "Longest Path is load-bearing.",
    body: "Early and late dates, total float, criticality — computed in this product. It is not an import you have to trust.",
    object: (
      <div className="meeting-screen meeting-object" aria-hidden>
        <div className="meeting-gantt-row" data-critical="true">
          <span className="meeting-bar meeting-bar-c" data-critical="true" style={{ left: "18%", width: "62%" }} />
        </div>
        <div className="meeting-row" data-critical="true">
          <i className="meeting-swatch meeting-swatch-c" />
          <span>C Concrete package</span>
          <span className="meeting-crit">LP</span>
        </div>
      </div>
    ),
  },
  {
    id: "float",
    name: "Float is the form you can remove.",
    body: "Non-critical work can slide. The oxide line cannot. That is the delay you take into the room.",
    object: (
      <div className="meeting-screen meeting-object" aria-hidden>
        <div className="meeting-row" data-critical="true">
          <span>B.2 Excavation</span>
          <span className="meeting-mono">TF 0</span>
        </div>
        <div className="meeting-row">
          <span>B.5 Dewatering</span>
          <span className="meeting-mono">TF 25</span>
        </div>
      </div>
    ),
  },
]

export function FeatureBeats() {
  return (
    <section id="features" className="relative bg-espresso-deep px-5 py-16 text-latte sm:px-8 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 sm:gap-24">
        {BEATS.map((beat) => (
          <article key={beat.id} className="feature-beat">
            <div>
              <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-extrabold leading-[0.88] tracking-[-0.035em] text-balance">
                {beat.name}
              </h2>
              <p className="mt-4 max-w-[42ch] font-ui text-[1.1rem] leading-relaxed text-foam">{beat.body}</p>
            </div>
            {beat.object}
          </article>
        ))}
      </div>
    </section>
  )
}
