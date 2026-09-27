export type PhaseId = "foundations" | "massing" | "structure" | "envelope" | "fitout"

export interface Phase {
  id: PhaseId
  label: string
  caption: string
  camera: { position: [number, number, number]; target: [number, number, number] }
}

export const PHASES: Phase[] = [
  {
    id: "foundations",
    label: "Foundations",
    caption: "The civil works: excavation, footings, the slab the whole path stands on.",
    camera: { position: [21, 10.5, 26], target: [-0.5, -0.9, 0] },
  },
  {
    id: "massing",
    label: "Massing",
    caption: "The bill sets the envelope before a single activity exists.",
    camera: { position: [33, 30, 33], target: [0, 5, 0] },
  },
  {
    id: "structure",
    label: "Structure",
    caption: "Slabs and columns: the frame the Longest Path runs through.",
    camera: { position: [18, 1.2, 31], target: [-1, 8, 0] },
  },
  {
    id: "envelope",
    label: "Envelope",
    caption: "Facade closes in parallel. Float lives here.",
    camera: { position: [0.01, 7.5, 44], target: [0, 7.4, 0] },
  },
  {
    id: "fitout",
    label: "Fit-out",
    caption: "Services, glazing, plant. Handover completes the spine.",
    camera: { position: [-31, 20, 38], target: [0, 5.8, 0] },
  },
]

export const PHASE_HOLD_MS = 2100
export const CAMERA_CUT_S = 0.55

export function phaseIndex(id: PhaseId): number {
  return PHASES.findIndex((phase) => phase.id === id)
}

/**
 * Which layers are visible from a given phase onward. Foundations are backfilled once the
 * massing is set; hard and soft landscaping go in with fit-out, ahead of handover.
 */
export function layersFor(index: number) {
  return {
    foundations: index === 0,
    massing: index === 1,
    structure: index >= 2,
    envelope: index >= 3,
    fitout: index >= 4,
    landscape: index >= 4,
  }
}

export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
