export type Beat = {
  id: string
  index: string
  name: string
  lead: string
  body: string
  code: string
  week: string
  handover?: boolean
}

export const BEATS: Beat[] = [
  {
    id: "excavate",
    index: "00",
    name: "EXCAVATE",
    lead: "The ground is already spoken for.",
    body: "Phases arrive from the approved bill. Scheduling cannot open a hole the cost book did not name.",
    code: "A1100",
    week: "W08",
  },
  {
    id: "found",
    index: "01",
    name: "FOUND",
    lead: "Locked roots. No invented floors.",
    body: "Every storey you will pour sits under a BOQ phase. The WBS does not negotiate.",
    code: "A1120",
    week: "W11",
  },
  {
    id: "form",
    index: "02",
    name: "FORM",
    lead: "Logic before concrete.",
    body: "Activities cage the void: finish-to-start, start-to-start, lag. The network is the formwork.",
    code: "A1180",
    week: "W16",
  },
  {
    id: "pour",
    index: "03",
    name: "POUR",
    lead: "Longest Path is load-bearing.",
    body: "Topological sort, early and late dates, total float — computed here. Criticality is not an import you have to trust.",
    code: "A1180",
    week: "W19",
  },
  {
    id: "strip",
    index: "04",
    name: "STRIP",
    lead: "Float is the form you can remove.",
    body: "Non-critical work can slide a week. The oxide line cannot. That is the delay you take into the room.",
    code: "A1210",
    week: "W22",
  },
  {
    id: "rise",
    index: "05",
    name: "RISE",
    lead: "The next storey waits on the last set.",
    body: "Retained Logic. A free crew does not skip a locked phase because someone is standing idle.",
    code: "A1240",
    week: "W26",
  },
  {
    id: "set",
    index: "06",
    name: "SET",
    lead: "Put the programme on the meeting screen.",
    body: "Internal project controls for planners and managers. Sign in if you have a seat. Request access if you do not.",
    code: "A1300",
    week: "W28",
    handover: true,
  },
]

export const FLOOR_COUNT = 5
export const STOREY_HEIGHT = 1.28
export const SLAB = { w: 6.4, d: 8.6, t: 0.16 }
export const PODIUM = { w: 7.2, d: 9.6, t: 0.46 }

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function beatIndexAt(progress: number) {
  return Math.min(BEATS.length - 1, Math.floor(clamp01(progress) * 0.999 * BEATS.length))
}

export function beatAt(progress: number) {
  return BEATS[beatIndexAt(progress)]
}

export type FloorPhase = {
  form: number
  pour: number
  strip: number
}

export function floorPhase(progress: number, index: number): FloorPhase {
  const start = 0.16 + index * 0.118
  const local = clamp01((progress - start) / 0.2)
  return {
    form: clamp01(local / 0.34),
    pour: clamp01((local - 0.2) / 0.4),
    strip: clamp01((local - 0.58) / 0.36),
  }
}

export function foundationProgress(progress: number) {
  return clamp01((progress - 0.05) / 0.12)
}

export function excavationProgress(progress: number) {
  return 0.42 + clamp01(progress / 0.1) * 0.58
}

export function coreHeight(progress: number) {
  const poured = FLOOR_COUNT * STOREY_HEIGHT * clamp01((progress - 0.12) / 0.78)
  return 0.4 + poured
}

export function roofProgress(progress: number) {
  return clamp01((progress - 0.86) / 0.1)
}
