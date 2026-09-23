import type { RoleId } from "../Mascot"

/** Site Mark steel/concrete tones used by the Roles figure. */
export type RolePalette = {
  body: string
  head: string
  ink: string
  paper: string
  steel: string
  steelSoft: string
  amber: string
  mark: string
  concrete: string
}

export const SITE_PALETTE: RolePalette = {
  body: "#0E1210",
  head: "#E2E7E5",
  ink: "#0E1210",
  paper: "#EEF1F0",
  steel: "#3E5A6C",
  steelSoft: "#CAD6DD",
  amber: "#E2A33B",
  mark: "#D4FF4A",
  concrete: "#D6DAD6",
}

export type RolePropId = "tablet" | "board" | "hardhat"

export type RoleLook = {
  id: RoleId
  /** Body mesh flat tint (Site Mark ink / steel). */
  bodyTint: string
  /** Head mesh flat tint (paper / surface). */
  headTint: string
  /** Mark accent — only on a small prop detail, never full-body. */
  accent: string
  props: RolePropId[]
  clip: string
  clipMode: "once-hold" | "loop" | "static-frame"
  /** Resting clip time (seconds) for prefers-reduced-motion. */
  restFrame: number
  scale: number
  /** Root group pose in the stage. */
  root: {
    position: [number, number, number]
    rotation: [number, number, number]
  }
  /** Authored prop placements (world-space siblings — Kenney bone scale shrinks portals). */
  propOffsets: Partial<
    Record<
      RolePropId,
      {
        position: [number, number, number]
        rotation: [number, number, number]
      }
    >
  >
  /** Camera look-at / framing hints consumed by RoleFigure. */
  frame: {
    camera: [number, number, number]
    lookAt: [number, number, number]
    fov: number
  }
}

/**
 * Mesh / material contract for `public/models/worker.glb` (Kenney character-male-e).
 *
 * Remapped (always):
 * - `body-mesh` → flat `meshStandardMaterial` from `bodyTint` (strips `colormap` baseColorTexture)
 * - `head-mesh` → flat `meshStandardMaterial` from `headTint` (strips `colormap` baseColorTexture)
 *
 * Hidden (default): none — only two meshes; both form the silhouette.
 * Optional hide list: unused LOD / ornaments if a future pack adds them (`ROLE_HIDE_MESHES`).
 *
 * Bones (attach candidates; props stay scene siblings due to bone scale):
 * - `root`, `leg-left`, `leg-right`, `torso`, `arm-left`, `arm-right`, `head`
 *
 * Clips: Kenney meshopt/quantized skins corrupt under AnimationMixer in this stack.
 * Role reads from tint + props; `clip` fields are reserved / unused until a non-quantized GLB.
 */
export const ROLE_HIDE_MESHES: string[] = []

/** Shared placements so inactive props can crossfade out on role swap. */
export const PROP_OFFSETS: Record<
  RolePropId,
  { position: [number, number, number]; rotation: [number, number, number] }
> = {
  hardhat: { position: [0, 0.58, 0.04], rotation: [0, 0, 0] },
  tablet: { position: [0.26, 0.28, 0.36], rotation: [-1.05, 0.25, 0.15] },
  board: { position: [0.55, 0.15, 0.06], rotation: [0, -0.4, 0] },
}

export const ROLE_LOOKS: Record<RoleId, RoleLook> = {
  planner: {
    id: "planner",
    bodyTint: "#3E5A6C",
    headTint: "#E2E7E5",
    accent: SITE_PALETTE.mark,
    props: ["hardhat", "tablet"],
    clip: "idle",
    clipMode: "static-frame",
    restFrame: 0,
    scale: 1.25,
    root: {
      position: [0, -0.35, 0],
      rotation: [0, -0.3, 0],
    },
    propOffsets: PROP_OFFSETS,
    frame: {
      camera: [2.2, 0.75, 3.6],
      lookAt: [0, 0.15, 0],
      fov: 30,
    },
  },
  pm: {
    id: "pm",
    bodyTint: "#0E1210",
    headTint: "#E2E7E5",
    accent: SITE_PALETTE.mark,
    props: ["hardhat", "board"],
    clip: "emote-yes",
    clipMode: "static-frame",
    restFrame: 0,
    scale: 1.25,
    root: {
      position: [0, -0.35, 0],
      rotation: [0, -0.18, 0],
    },
    propOffsets: PROP_OFFSETS,
    frame: {
      camera: [2.3, 0.8, 3.7],
      lookAt: [0.1, 0.15, 0],
      fov: 30,
    },
  },
}
