export type DepType = "FS" | "SS" | "FF" | "SF"

export type NodeKind = "phase_root" | "summary" | "leaf"

export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"

export interface CalendarInput {
  workingWeek: Record<Weekday, boolean>
  exceptions: Array<{ date: string; type: "holiday" | "extra_work" }>
}

export interface EngineNode {
  id: string
  parentId: string | null
  kind: NodeKind
  durationDays: number
  isLoe: boolean
  spanStartId?: string | null
  spanEndId?: string | null
}

export interface EngineDependency {
  predecessorId: string
  successorId: string
  type: DepType
  lagDays: number
}

export interface RecalcInput {
  nodes: EngineNode[]
  dependencies: EngineDependency[]
  calendar: CalendarInput
}

export interface NodeMetrics {
  es: number
  ef: number
  ls: number
  lf: number
  totalFloat: number | null
  freeFloat: number | null
  isCritical: boolean
}

export type RecalcResult =
  | {
      ok: true
      metrics: Record<string, NodeMetrics>
      criticalIds: string[]
      projectDurationDays: number
    }
  | {
      ok: false
      error: { type: "cycle"; nodeIds: string[] }
    }
