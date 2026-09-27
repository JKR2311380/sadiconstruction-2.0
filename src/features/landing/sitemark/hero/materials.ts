import * as THREE from "three"

/*
 * Procedural, tileable grayscale surfaces. The hue comes from each material's colour; the
 * canvas only carries tone, joints and grain, and doubles as the bump map. Boxes get world
 * UVs in metres (see BuildingMesh), so a texture's `metres` is the real size of one tile.
 */

const SIZE = 512

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rand = () => number
const gray = (v: number, a = 1) => {
  const c = Math.round(Math.min(1, Math.max(0, v)) * 255)
  return `rgba(${c},${c},${c},${a})`
}
const WRAP = [-SIZE, 0, SIZE]

function surface(seed: number, base: number, paint: (ctx: CanvasRenderingContext2D, r: Rand) => void, grain: number) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext("2d")!
  const r = seeded(seed)
  ctx.fillStyle = gray(base)
  ctx.fillRect(0, 0, SIZE, SIZE)
  paint(ctx, r)
  const img = ctx.getImageData(0, 0, SIZE, SIZE)
  for (let i = 0; i < img.data.length; i += 4) {
    const d = (r() - 0.5) * grain * 255
    img.data[i] += d
    img.data[i + 1] += d
    img.data[i + 2] += d
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

/** Soft light and dark patches, drawn wrapped so the tile has no seam. */
function blotches(ctx: CanvasRenderingContext2D, r: Rand, count: number, min: number, max: number, amp: number) {
  for (let i = 0; i < count; i++) {
    const x = r() * SIZE
    const y = r() * SIZE
    const rad = min + r() * (max - min)
    const v = r() < 0.5 ? 0 : 1
    const a = r() * amp
    for (const dx of WRAP) {
      for (const dy of WRAP) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad)
        g.addColorStop(0, gray(v, a))
        g.addColorStop(1, gray(v, 0))
        ctx.fillStyle = g
        ctx.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2)
      }
    }
  }
}

function specks(ctx: CanvasRenderingContext2D, r: Rand, count: number, size: [number, number], tone: [number, number], alpha: number) {
  for (let i = 0; i < count; i++) {
    const s = size[0] + r() * (size[1] - size[0])
    ctx.fillStyle = gray(tone[0] + r() * (tone[1] - tone[0]), alpha)
    ctx.fillRect(r() * SIZE, r() * SIZE, s, s)
  }
}

/** A joint line at a tile fraction, straddling the seam when it sits on 0. */
function joint(ctx: CanvasRenderingContext2D, axis: "u" | "v", at: number, width: number, v: number, a: number) {
  ctx.fillStyle = gray(v, a)
  const p = at * SIZE - width / 2
  for (const off of WRAP) {
    if (axis === "u") ctx.fillRect(p + off, 0, width, SIZE)
    else ctx.fillRect(0, p + off, SIZE, width)
  }
}

const concrete = () =>
  surface(11, 0.86, (ctx, r) => {
    blotches(ctx, r, 70, 20, 110, 0.08)
    specks(ctx, r, 1400, [1, 2.5], [0.35, 0.55], 0.5)
  }, 0.07)

/** 1.2 × 2.4 m plywood forms: panel joints and tie holes, over concrete. */
const formwork = () =>
  surface(23, 0.85, (ctx, r) => {
    blotches(ctx, r, 60, 20, 100, 0.08)
    specks(ctx, r, 1200, [1, 2.5], [0.35, 0.55], 0.5)
    joint(ctx, "u", 0, 2, 0.5, 0.55)
    joint(ctx, "u", 0.5, 2, 0.5, 0.55)
    joint(ctx, "v", 0, 2, 0.5, 0.55)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        ctx.fillStyle = gray(0.32, 0.7)
        ctx.beginPath()
        ctx.arc(64 + i * 128, 64 + j * 128, 3.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, 0.06)

/** Flush metal rainscreen: one vertical joint per tile, faint rolling streaks. */
const panel = () =>
  surface(37, 0.93, (ctx, r) => {
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = gray(r() < 0.5 ? 0.8 : 1, 0.035)
      ctx.fillRect(0, r() * SIZE, SIZE, 1 + r() * 2)
    }
    joint(ctx, "u", 0, 4, 0.42, 0.75)
    joint(ctx, "u", 0.012, 2, 1, 0.35)
  }, 0.025)

/** 600 mm pavers, two by two per tile, each with its own tone. */
const paving = () =>
  surface(41, 0.84, (ctx, r) => {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = gray(0.8 + r() * 0.1)
        ctx.fillRect(i * (SIZE / 2), j * (SIZE / 2), SIZE / 2, SIZE / 2)
      }
    }
    blotches(ctx, r, 30, 20, 70, 0.05)
    specks(ctx, r, 2500, [1, 2], [0.4, 1], 0.35)
    for (const at of [0, 0.5]) {
      joint(ctx, "u", at, 3, 0.45, 0.8)
      joint(ctx, "v", at, 3, 0.45, 0.8)
    }
  }, 0.06)

const gravel = () =>
  surface(53, 0.66, (ctx, r) => {
    specks(ctx, r, 26000, [1.5, 3.5], [0.35, 1], 0.55)
  }, 0.1)

const earth = () =>
  surface(67, 0.7, (ctx, r) => {
    blotches(ctx, r, 90, 25, 120, 0.16)
    specks(ctx, r, 1800, [1.5, 4], [0.8, 1], 0.5)
    specks(ctx, r, 2500, [1, 2.5], [0.2, 0.4], 0.4)
  }, 0.12)

/** Open ground seen from a distance: fine grit, barely any patching, so it never reads as cloud. */
const grit = () =>
  surface(89, 0.84, (ctx, r) => {
    blotches(ctx, r, 24, 40, 140, 0.025)
    specks(ctx, r, 9000, [1, 2], [0.55, 1], 0.25)
  }, 0.05)

/** Leaf-scale mottling for tree crowns. */
const leaves = () =>
  surface(97, 0.72, (ctx, r) => {
    specks(ctx, r, 14000, [2, 5], [0.35, 1], 0.5)
  }, 0.12)

const asphalt = () =>
  surface(79, 0.55, (ctx, r) => {
    blotches(ctx, r, 40, 30, 120, 0.06)
    specks(ctx, r, 34000, [1, 2], [0.2, 0.95], 0.3)
  }, 0.08)

function tiled(canvas: HTMLCanvasElement, metres: number, colour: boolean) {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metres, 1 / metres)
  t.anisotropy = 8
  t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace
  return t
}

function textured(
  canvas: HTMLCanvasElement,
  metres: number,
  params: THREE.MeshStandardMaterialParameters,
  bump = 1,
) {
  return new THREE.MeshStandardMaterial({
    ...params,
    map: tiled(canvas, metres, true),
    bumpMap: tiled(canvas, metres, false),
    bumpScale: bump,
  })
}

function build() {
  const c = {
    concrete: concrete(),
    formwork: formwork(),
    panel: panel(),
    paving: paving(),
    gravel: gravel(),
    earth: earth(),
    asphalt: asphalt(),
    grit: grit(),
    leaves: leaves(),
  }
  return {
    mass: new THREE.MeshStandardMaterial({ color: "#CDD3D0", roughness: 0.95 }),
    concrete: textured(c.concrete, 3, { color: "#E2E4DF", roughness: 0.92 }),
    blinding: textured(c.concrete, 2, { color: "#C4C6BE", roughness: 1 }, 1.4),
    footing: textured(c.concrete, 2.5, { color: "#A9ABA2", roughness: 0.95 }),
    formwork: textured(c.formwork, 2.4, { color: "#D4D8D3", roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: "#3E5A6C", roughness: 0.5, metalness: 0.45 }),
    panel: textured(c.panel, 1, { color: "#EEF2F3", roughness: 0.55, metalness: 0.1 }, 0.6),
    datum: textured(c.panel, 2, { color: "#D9E0E3", roughness: 0.55, metalness: 0.1 }, 0.6),
    metal: new THREE.MeshStandardMaterial({ color: "#7D8B93", roughness: 0.4, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({
      color: "#4C6774",
      roughness: 0.04,
      metalness: 0.6,
      transparent: true,
      opacity: 0.86,
      envMapIntensity: 1.4,
    }),
    ceiling: new THREE.MeshStandardMaterial({
      color: "#F1EDE4",
      emissive: "#F4E9D0",
      emissiveIntensity: 0.55,
      roughness: 0.9,
    }),
    opening: new THREE.MeshStandardMaterial({ color: "#1F282E", roughness: 0.8 }),
    plant: textured(c.panel, 0.5, { color: "#6F8793", roughness: 0.5, metalness: 0.35 }, 0.5),
    paving: textured(c.paving, 1.2, { color: "#D8DBD6", roughness: 0.9 }, 1.2),
    kerb: textured(c.concrete, 1.5, { color: "#C9CCC6", roughness: 0.9 }),
    gravel: textured(c.gravel, 1.5, { color: "#B9BDB6", roughness: 1 }, 1.6),
    site: textured(c.gravel, 3, { color: "#B3BAB5", roughness: 1 }, 0.8),
    ground: textured(c.grit, 5, { color: "#C9CFCB", roughness: 1 }, 0.4),
    earth: textured(c.earth, 4, { color: "#7A6650", roughness: 1, side: THREE.DoubleSide }, 2),
    asphalt: textured(c.asphalt, 5, { color: "#6A7072", roughness: 0.95 }, 0.8),
    marking: new THREE.MeshStandardMaterial({ color: "#E9ECEA", roughness: 0.8 }),
    planting: textured(c.earth, 2, { color: "#6F7E62", roughness: 1 }, 1.5),
    foliage: textured(c.leaves, 0.9, { color: "#6A7C62", roughness: 0.95 }, 2.5),
    trunk: new THREE.MeshStandardMaterial({ color: "#5E5A52", roughness: 1 }),
    ink: new THREE.LineBasicMaterial({ color: "#0E1210", transparent: true, opacity: 0.7 }),
  }
}

export type SiteMaterials = ReturnType<typeof build>

let cache: SiteMaterials | null = null

/** One shared set for the hero canvas; the landing keeps a single scene alive. */
export function siteMaterials() {
  cache ??= build()
  return cache
}
