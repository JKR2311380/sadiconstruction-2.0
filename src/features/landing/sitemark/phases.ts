export type PhaseId = "massing" | "structure" | "envelope" | "fitout"

export interface Phase {
  id: PhaseId
  label: string
  caption: string
  camera: { position: [number, number, number]; target: [number, number, number] }
}

export const PHASES: Phase[] = [
  {
    id: "massing",
    label: "Massing",
    caption: "The bill sets the envelope before a single activity exists.",
    camera: { position: [31, 27, 31], target: [0, 3.6, 0] },
  },
  {
    id: "structure",
    label: "Structure",
    caption: "Slabs and columns: the frame the Longest Path runs through.",
    camera: { position: [17, 1.1, 29], target: [-1, 6.6, 0] },
  },
  {
    id: "envelope",
    label: "Envelope",
    caption: "Facade closes in parallel. Float lives here.",
    camera: { position: [0.01, 6.5, 38], target: [0, 6, 0] },
  },
  {
    id: "fitout",
    label: "Fit-out",
    caption: "Services, glazing, plant. Handover waits on the spine.",
    camera: { position: [-30, 17, 36], target: [0, 4.6, 0] },
  },
]

export const PHASE_HOLD_MS = 3600
export const CAMERA_CUT_S = 0.8

export function phaseIndex(id: PhaseId): number {
  return PHASES.findIndex((phase) => phase.id === id)
}

/** Which layers are visible from a given phase onward. */
export function layersFor(index: number) {
  return {
    massing: index === 0,
    structure: index >= 1,
    envelope: index >= 2,
    fitout: index >= 3,
  }
}

export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
