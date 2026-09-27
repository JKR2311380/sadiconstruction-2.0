import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { expoOut, layersFor } from "../phases"
import { siteMaterials } from "./materials"
import { Shrubs } from "./Planting"

/*
 * Composite steel frame (H-columns, primary and secondary I-beams, concrete slab on deck) on
 * pad footings, braced by an in-situ concrete stair/lift core on a raft.
 * Slab n is centred on n × FLOOR_H; slab 0 is the slab-on-grade.
 */
const FLOOR_H = 3.6
const SLAB_T = 0.3
const CLEAR = FLOOR_H - SLAB_T
const slabTop = (n: number) => n * FLOOR_H + SLAB_T / 2
const soffit = (n: number) => n * FLOOR_H - SLAB_T / 2

/* One structural grid sets out footings, columns, beams, core walls and facade piers alike. */
const GRID_X = [-7.5, -2.5, 2.5, 7.5] // 5.0 m bays
const GRID_Z = [-6, -2, 2, 6] // 4.0 m bays
const TOWER_X = GRID_X.slice(0, 3)
const TOWER_Z = GRID_Z.slice(0, 3)
const CORE_X = GRID_X.slice(0, 2)
const CORE_Z = GRID_Z.slice(0, 2)
const TOWER_FLOORS = 3
const ROOF = TOWER_FLOORS + 1
const EDGE = 0.5 // slab edge cantilever past the perimeter column line

export interface Rect {
  x0: number
  x1: number
  z0: number
  z1: number
}
const around = (xs: number[], zs: number[], pad: number): Rect => ({
  x0: xs[0] - pad,
  x1: xs[xs.length - 1] + pad,
  z0: zs[0] - pad,
  z1: zs[zs.length - 1] + pad,
})
const grow = (r: Rect, d: number): Rect => ({ x0: r.x0 - d, x1: r.x1 + d, z0: r.z0 - d, z1: r.z1 + d })

const PODIUM = around(GRID_X, GRID_Z, EDGE) // 16 × 13
const TOWER = around(TOWER_X, TOWER_Z, EDGE) // 11 × 9, flush with the podium on its back and left faces
/** Core walls sit on the gridlines of the tower's back-left bay and take over its four columns. */
const CORE = around(CORE_X, CORE_Z, 0.15)
export const FOOTPRINT = PODIUM

/* Below grade: 1:1 battered cut with working space, blinding, then pads and the core raft. */
const FORMATION = -1.5
const BEARING = FORMATION + 0.08
const RAFT_T = 1
export const EXCAVATION = {
  floor: grow(PODIUM, 1.2),
  top: grow(PODIUM, 1.2 - FORMATION),
  depth: -FORMATION,
}

/* Envelope: one unitised curtain-wall grammar on every storey. */
const SILL = 1.05
const HEAD = 0.55
const SKIN = 0.26
const PIER = 0.6 // column-line pier; clads the perimeter column behind it
const MULLION = 0.08
const MODULE = 1 // panel width; divides the 5 m and 4 m bays exactly
const DATUM = SKIN + 0.14
const SCREEN_H = 2.4 // roof plant screen and lift overrun share one top
const RECESS = 1.5 // entrance lobby set back behind the podium face
const ENTRANCE_BAY = 1 // the middle bay of the podium's street face

/* ── Load takedown: tributary slab area decides column sections and pad sizes. ── */

/** Half of each adjacent bay, or the slab-edge cantilever at the perimeter. */
function tributary(lines: number[], v: number) {
  const i = lines.indexOf(v)
  const before = i > 0 ? (v - lines[i - 1]) / 2 : EDGE
  const after = i < lines.length - 1 ? (lines[i + 1] - v) / 2 : EDGE
  return before + after
}

const inTower = (x: number, z: number) => TOWER_X.includes(x) && TOWER_Z.includes(z)
const inCore = (x: number, z: number) => CORE_X.includes(x) && CORE_Z.includes(z)

/** Slab area (m²) that floor n hands to the column at (x, z). */
function slabArea(n: number, x: number, z: number) {
  if (n === 1) return tributary(GRID_X, x) * tributary(GRID_Z, z)
  return inTower(x, z) ? tributary(TOWER_X, x) * tributary(TOWER_Z, z) : 0
}

interface Column {
  x: number
  z: number
  /** loads[s] = slab area carried through storey s; the base load sizes the pad. */
  loads: number[]
}

const COLUMNS: Column[] = GRID_X.flatMap((x) =>
  GRID_Z.filter((z) => !inCore(x, z)).map((z) => {
    const top = inTower(x, z) ? ROOF : 1
    const loads = Array.from({ length: top }, (_, s) => {
      let area = 0
      for (let n = s + 1; n <= top; n++) area += slabArea(n, x, z)
      return area
    })
    return { x, z, loads }
  }),
)

const columnSection = (area: number) => 0.28 + 0.03 * Math.sqrt(area)
const padSide = (area: number) => 0.6 + 0.28 * Math.sqrt(area)
const padDepth = (area: number) => 0.3 + 0.07 * Math.sqrt(area)

/* ── Geometry helpers ── */

type Vec3 = [number, number, number]
interface BoxSpec {
  pos: Vec3
  size: Vec3
}

/** Box-projected UVs in metres from the grid origin, so joints line up across elements. */
function worldUV(g: THREE.BufferGeometry, [px, py, pz]: Vec3) {
  const p = g.attributes.position
  const n = g.attributes.normal
  const uv = g.attributes.uv
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + px - GRID_X[0]
    const y = p.getY(i) + py
    const z = p.getZ(i) + pz - GRID_Z[0]
    if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, z, y)
    else if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, x, z)
    else uv.setXY(i, x, y)
  }
  uv.needsUpdate = true
}

/** A textured box; `edges` draws its outline in ink, reserved for the major volumes. */
function Box({ pos, size, material, edges = false }: BoxSpec & { material: THREE.Material; edges?: boolean }) {
  const { geometry, outline } = useMemo(() => {
    const g = new THREE.BoxGeometry(...size)
    worldUV(g, pos)
    return { geometry: g, outline: edges ? new THREE.EdgesGeometry(g, 20) : null }
  }, [pos, size, edges])
  useEffect(
    () => () => {
      geometry.dispose()
      outline?.dispose()
    },
    [geometry, outline],
  )
  return (
    <mesh position={pos} geometry={geometry} material={material} castShadow receiveShadow>
      {outline && <lineSegments geometry={outline} material={siteMaterials().ink} />}
    </mesh>
  )
}

function boxes(specs: BoxSpec[], material: THREE.Material, key: string, edges = false) {
  return specs.map((spec, i) => <Box key={`${key}${i}`} {...spec} material={material} edges={edges} />)
}

const UNIT = new THREE.BoxGeometry(1, 1, 1)

/** Many small untextured parts (mullions, fins, bars, steel sections) in one draw call. */
function Instanced({ specs, material }: { specs: BoxSpec[]; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    specs.forEach((spec, i) => mesh.setMatrixAt(i, m.compose(p.set(...spec.pos), q, s.set(...spec.size))))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [specs])
  return <instancedMesh ref={ref} args={[UNIT, material, specs.length]} castShadow receiveShadow />
}

/** Axis-aligned box spanning a plan rectangle between two elevations. */
function slab(r: Rect, y0: number, y1: number): BoxSpec {
  return {
    pos: [(r.x0 + r.x1) / 2, (y0 + y1) / 2, (r.z0 + r.z1) / 2],
    size: [r.x1 - r.x0, y1 - y0, r.z1 - r.z0],
  }
}

/** Four thin walls around a plan rectangle. */
function ring(r: Rect, y0: number, y1: number, t: number): BoxSpec[] {
  return [
    slab({ ...r, z1: r.z0 + t }, y0, y1),
    slab({ ...r, z0: r.z1 - t }, y0, y1),
    slab({ ...r, x1: r.x0 + t, z0: r.z0 + t, z1: r.z1 - t }, y0, y1),
    slab({ ...r, x0: r.x1 - t, z0: r.z0 + t, z1: r.z1 - t }, y0, y1),
  ]
}

/** Rolled H-column: two flanges and a web, flanges parallel to x. */
function hColumn(x: number, z: number, y0: number, y1: number, c: number): BoxSpec[] {
  const h = y1 - y0
  const y = (y0 + y1) / 2
  const tf = 0.05
  return [
    { pos: [x, y, z - c / 2 + tf / 2], size: [c, h, tf] },
    { pos: [x, y, z + c / 2 - tf / 2], size: [c, h, tf] },
    { pos: [x, y, z], size: [0.035, h, c - 2 * tf] },
  ]
}

/** I-beam hung from a slab soffit, running along x or z between two gridlines. */
function iBeam(along: "x" | "z", a: number, b: number, at: number, top: number, depth: number): BoxSpec[] {
  const len = b - a
  const mid = (a + b) / 2
  const tf = 0.03
  const w = depth * 0.42
  const part = (y: number, h: number, width: number): BoxSpec =>
    along === "x" ? { pos: [mid, y, at], size: [len, h, width] } : { pos: [at, y, mid], size: [width, h, len] }
  return [part(top - tf / 2, tf, w), part(top - depth + tf / 2, tf, w), part(top - depth / 2, depth - 2 * tf, 0.02)]
}

/** Primary beams on every gridline, one secondary per bay; core walls replace the beams on their lines. */
function framing(n: number): BoxSpec[] {
  const xs = n === 1 ? GRID_X : TOWER_X
  const zs = n === 1 ? GRID_Z : TOWER_Z
  const top = soffit(n)
  const out: BoxSpec[] = []
  for (const z of zs) {
    for (let i = 0; i < xs.length - 1; i++) {
      if (inCore(xs[i], z) && inCore(xs[i + 1], z)) continue
      out.push(...iBeam("x", xs[i], xs[i + 1], z, top, 0.45))
    }
  }
  for (const x of xs) {
    for (let j = 0; j < zs.length - 1; j++) {
      if (inCore(x, zs[j]) && inCore(x, zs[j + 1])) continue
      out.push(...iBeam("z", zs[j], zs[j + 1], x, top, 0.45))
    }
  }
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      if (inCore(xs[i], zs[j]) && inCore(xs[i + 1], zs[j + 1])) continue
      out.push(...iBeam("z", zs[j], zs[j + 1], (xs[i] + xs[i + 1]) / 2, top, 0.35))
    }
  }
  return out
}

interface Face {
  along: "x" | "z"
  at: number
  from: number
  to: number
  lines: number[]
}

function faces(r: Rect, xs: number[], zs: number[]): Face[] {
  return [
    { along: "x", at: r.z1, from: r.x0, to: r.x1, lines: xs },
    { along: "x", at: r.z0, from: r.x0, to: r.x1, lines: xs },
    { along: "z", at: r.x1, from: r.z0, to: r.z1, lines: zs },
    { along: "z", at: r.x0, from: r.z0, to: r.z1, lines: zs },
  ]
}

/** A box centred on a face line: `a` runs along the face, `depth` goes through it. */
function onFace(f: Face, a: number, y: number, len: number, h: number, depth: number, inset = 0): BoxSpec {
  const at = f.at + inset
  return f.along === "x"
    ? { pos: [a, y, at], size: [len, h, depth] }
    : { pos: [at, y, a], size: [depth, h, len] }
}

/** A band that wraps the whole face, corners included. */
function band(f: Face, y0: number, y1: number, depth: number): BoxSpec {
  return onFace(f, (f.from + f.to) / 2, (y0 + y1) / 2, f.to - f.from + depth, y1 - y0, depth)
}

interface Skin {
  bands: BoxSpec[]
  piers: BoxSpec[]
  mullions: BoxSpec[]
  glass: BoxSpec[]
}

const isStreetFace = (f: Face) => f.along === "x" && f.at === PODIUM.z1

/**
 * One storey of curtain wall on one face. Piers land on the structural gridlines, solid
 * panels close the corners, and mullions split every bay on the same 1 m module.
 * `skip` leaves a bay open for a recess.
 */
function storey(f: Face, y0: number, sill: number, drawn: { sill: boolean; head: boolean }, out: Skin, skip = -1) {
  const yb = y0 + sill
  const yt = y0 + CLEAR - HEAD
  const hv = yt - yb
  const yv = yb + hv / 2
  const first = f.lines[0]
  const last = f.lines[f.lines.length - 1]

  if (drawn.sill && sill > 0) out.bands.push(band(f, y0, yb, SKIN))
  if (drawn.head) out.bands.push(band(f, yt, yt + HEAD, SKIN))

  const cornerA = first + PIER / 2 - (f.from - SKIN / 2)
  const cornerB = f.to + SKIN / 2 - (last - PIER / 2)
  out.piers.push(onFace(f, f.from - SKIN / 2 + cornerA / 2, yv, cornerA, hv, SKIN))
  out.piers.push(onFace(f, f.to + SKIN / 2 - cornerB / 2, yv, cornerB, hv, SKIN))
  for (const line of f.lines.slice(1, -1)) out.piers.push(onFace(f, line, yv, PIER, hv, SKIN + 0.08))

  for (let i = 0; i < f.lines.length - 1; i++) {
    if (i === skip) continue
    const a0 = f.lines[i]
    const a1 = f.lines[i + 1]
    for (let a = a0 + MODULE; a < a1 - 1e-6; a += MODULE) out.mullions.push(onFace(f, a, yv, MULLION, hv, SKIN + 0.06))
    out.glass.push(onFace(f, (a0 + a1) / 2, yv, a1 - a0, hv, 0.03))
  }
}

const onPodiumLine = (f: Face) =>
  f.along === "x" ? f.at === PODIUM.z0 || f.at === PODIUM.z1 : f.at === PODIUM.x0 || f.at === PODIUM.x1

/** Drops a layer into place with an expo settle whenever it becomes visible. */
function Layer({ visible, children }: { visible: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const shownAt = useRef<number | null>(null)

  useFrame((state) => {
    const group = ref.current
    if (!group) return
    if (!visible) {
      shownAt.current = null
      return
    }
    const now = state.clock.getElapsedTime()
    if (shownAt.current === null) shownAt.current = now
    const t = Math.min(1, (now - shownAt.current) / 0.45)
    group.position.y = (1 - expoOut(t)) * 0.9
    if (t < 1) state.invalidate()
  })

  return (
    <group ref={ref} visible={visible}>
      {children}
    </group>
  )
}

export function BuildingMesh({ phase }: { phase: number }) {
  const m = siteMaterials()
  const layers = layersFor(phase)

  const foundations = useMemo(() => {
    const blinding = slab(grow(PODIUM, 0.6), FORMATION, BEARING)
    const pads: BoxSpec[] = []
    const pedestals: BoxSpec[] = []
    const plates: BoxSpec[] = []
    for (const { x, z, loads } of COLUMNS) {
      const side = padSide(loads[0])
      const depth = padDepth(loads[0])
      const col = columnSection(loads[0])
      pads.push({ pos: [x, BEARING + depth / 2, z], size: [side, depth, side] })
      const stub = BEARING + depth
      pedestals.push({ pos: [x, stub / 2, z], size: [col + 0.3, -stub, col + 0.3] })
      plates.push({ pos: [x, 0.02, z], size: [col + 0.18, 0.04, col + 0.18] })
      // Holding-down bolts cast into the pedestal, one per plate corner.
      for (const dx of [-1, 1]) {
        for (const dz of [-1, 1]) {
          plates.push({ pos: [x + (dx * col) / 2, 0.14, z + (dz * col) / 2], size: [0.035, 0.24, 0.035] })
        }
      }
    }
    const raftTop = BEARING + RAFT_T
    const raft = slab(grow(CORE, 0.8), BEARING, raftTop)
    const kickers = ring(CORE, raftTop, 0.2, 0.3)
    const starters: BoxSpec[] = []
    const bar = (x: number, z: number) => starters.push({ pos: [x, 0.8, z], size: [0.04, 1.2, 0.04] })
    for (let x = CORE_X[0]; x <= CORE_X[1] + 1e-6; x += 0.3) CORE_Z.forEach((z) => bar(x, z))
    for (let z = CORE_Z[0] + 0.3; z < CORE_Z[1] - 1e-6; z += 0.3) CORE_X.forEach((x) => bar(x, z))
    return { blinding, pads, pedestals, plates, raft, kickers, starters }
  }, [])

  const massing = useMemo(
    () => [slab(PODIUM, 0, slabTop(1)), slab(TOWER, slabTop(1), slabTop(ROOF))],
    [],
  )

  const structure = useMemo(() => {
    const slabs = [slab(PODIUM, -SLAB_T / 2, SLAB_T / 2), slab(PODIUM, soffit(1), slabTop(1))]
    for (let n = 2; n <= ROOF; n++) slabs.push(slab(TOWER, soffit(n), slabTop(n)))
    const steel: BoxSpec[] = []
    for (const { x, z, loads } of COLUMNS) {
      loads.forEach((area, s) => {
        steel.push(...hColumn(x, z, s === 0 ? 0 : slabTop(s), soffit(s + 1), columnSection(area)))
      })
    }
    for (let n = 1; n <= ROOF; n++) steel.push(...framing(n))
    const core = slab(CORE, BEARING + RAFT_T, slabTop(ROOF) + SCREEN_H)
    // Lift and stair doors on the core's floor-plate face, every served level.
    const openings: BoxSpec[] = []
    for (let n = 0; n < ROOF; n++) {
      const y0 = slabTop(n)
      openings.push(slab({ x0: -6.6, x1: -5.4, z0: CORE.z1 - 0.02, z1: CORE.z1 + 0.02 }, y0, y0 + 2.2))
      openings.push(slab({ x0: -4.1, x1: -3.1, z0: CORE.z1 - 0.02, z1: CORE.z1 + 0.02 }, y0, y0 + 2.1))
    }
    return { slabs, steel, core, openings }
  }, [])

  const envelope = useMemo(() => {
    const skin: Skin = { bands: [], piers: [], mullions: [], glass: [] }
    // Ground storey is storefront: no sill, and the datum band takes its head zone.
    for (const f of faces(PODIUM, GRID_X, GRID_Z)) {
      storey(f, slabTop(0), 0, { sill: false, head: false }, skin, isStreetFace(f) ? ENTRANCE_BAY : -1)
    }
    for (let n = 1; n <= TOWER_FLOORS; n++) {
      for (const f of faces(TOWER, TOWER_X, TOWER_Z)) {
        const sill = !(n === 1 && onPodiumLine(f))
        storey(f, slabTop(n), SILL, { sill, head: n < TOWER_FLOORS }, skin)
      }
    }

    // Entrance lobby: glazing set back between the piers, panel returns, a soffit overhead.
    const front = PODIUM.z1
    const inner = GRID_X[ENTRANCE_BAY + 1] - PIER / 2
    const lobbyTop = soffit(1) - HEAD
    const lobbyLine = front - RECESS
    const lobby = { x0: -inner, x1: inner, z0: lobbyLine, z1: front }
    skin.glass.push(slab({ ...lobby, z0: lobbyLine - 0.015, z1: lobbyLine + 0.015 }, slabTop(0), lobbyTop))
    for (let x = GRID_X[ENTRANCE_BAY] + MODULE; x < GRID_X[ENTRANCE_BAY + 1] - 1e-6; x += MODULE) {
      skin.mullions.push(slab({ x0: x - MULLION / 2, x1: x + MULLION / 2, z0: lobbyLine - 0.15, z1: lobbyLine + 0.15 }, slabTop(0), lobbyTop))
    }
    const returns = [-1, 1].map((s) =>
      slab(s < 0 ? { ...lobby, x0: -inner - 0.2, x1: -inner } : { ...lobby, x0: inner, x1: inner + 0.2 }, slabTop(0), lobbyTop),
    )
    const lobbySoffit = slab(lobby, lobbyTop - 0.1, lobbyTop)

    // Podium head + slab edge + terrace upstand read as one datum; the tower crown repeats it.
    const datumTops = [slabTop(1) + SILL, slabTop(ROOF) + SILL]
    const datum = [
      ...faces(PODIUM, GRID_X, GRID_Z).map((f) => band(f, soffit(1) - HEAD, datumTops[0], DATUM)),
      ...faces(TOWER, TOWER_X, TOWER_Z).map((f) => band(f, soffit(ROOF) - HEAD, datumTops[1], DATUM)),
    ]
    const copings = [
      ...faces(PODIUM, GRID_X, GRID_Z).map((f) => band(f, datumTops[0], datumTops[0] + 0.06, DATUM + 0.08)),
      ...faces(TOWER, TOWER_X, TOWER_Z).map((f) => band(f, datumTops[1], datumTops[1] + 0.06, DATUM + 0.08)),
    ]

    // Roofing: ballast on the tower roof, pavers on the podium terrace.
    const roof = slabTop(ROOF)
    const ballast = slab(grow(TOWER, -0.25), roof, roof + 0.08)
    const terrace = slab(grow(PODIUM, -0.25), slabTop(1), slabTop(1) + 0.08)

    // Louvred plant screen: vertical blades between top and bottom rails.
    const plantZone: Rect = { x0: CORE.x1 + 0.75, x1: TOWER.x1 - 0.8, z0: TOWER.z0 + 0.9, z1: TOWER.z1 - 0.9 }
    const louvres = [...ring(plantZone, roof + 0.08, roof + 0.2, 0.08), ...ring(plantZone, roof + SCREEN_H - 0.1, roof + SCREEN_H, 0.08)]
    const bladeY = roof + (SCREEN_H + 0.2) / 2
    const bladeH = SCREEN_H - 0.3
    for (let x = plantZone.x0; x <= plantZone.x1 + 1e-6; x += 0.2) {
      for (const z of [plantZone.z0 + 0.04, plantZone.z1 - 0.04]) louvres.push({ pos: [x, bladeY, z], size: [0.03, bladeH, 0.16] })
    }
    for (let z = plantZone.z0 + 0.2; z < plantZone.z1 - 1e-6; z += 0.2) {
      for (const x of [plantZone.x0 + 0.04, plantZone.x1 - 0.04]) louvres.push({ pos: [x, bladeY, z], size: [0.16, bladeH, 0.03] })
    }
    const overrun = slab(grow(CORE, 0.1), roof, roof + SCREEN_H + 0.05)
    const overrunCap = slab(grow(CORE, 0.16), roof + SCREEN_H + 0.05, roof + SCREEN_H + 0.1)

    return { ...skin, returns, lobbySoffit, datum, copings, ballast, terrace, louvres, overrun, overrunCap, plantZone, lobby }
  }, [])

  const fitout = useMemo(() => {
    const roof = slabTop(ROOF)
    const { plantZone: p, lobby } = envelope
    const cx = (p.x0 + p.x1) / 2
    const ahu: BoxSpec = { pos: [cx + 0.3, roof + 0.88, p.z0 + 2.3], size: [2.4, 1.6, 3.6] }
    const chillers: BoxSpec[] = [
      { pos: [p.x0 + 1.05, roof + 0.73, p.z1 - 1.3], size: [1.3, 1.3, 1.3] },
      { pos: [p.x1 - 1.05, roof + 0.73, p.z1 - 1.3], size: [1.3, 1.3, 1.3] },
    ]
    // Plinths under the plant, a supply duct back to the core riser, fan guards on the chillers.
    const services: BoxSpec[] = [
      { pos: [ahu.pos[0], roof + 0.12, ahu.pos[2]], size: [2.6, 0.08, 3.8] },
      ...chillers.map((c): BoxSpec => ({ pos: [c.pos[0], roof + 0.12, c.pos[2]], size: [1.5, 0.08, 1.5] })),
      slab({ x0: CORE.x1 + 0.1, x1: ahu.pos[0] - 1.2, z0: ahu.pos[2] - 0.35, z1: ahu.pos[2] + 0.35 }, roof + 1.1, roof + 1.7),
      ...chillers.map((c): BoxSpec => ({ pos: [c.pos[0], c.pos[1] + 0.68, c.pos[2]], size: [0.9, 0.06, 0.9] })),
    ]
    const canopyTop = soffit(1) - HEAD
    const canopyUnder = canopyTop - 0.22
    const front = PODIUM.z1
    const canopy = slab({ x0: GRID_X[1] - 0.3, x1: GRID_X[2] + 0.3, z0: front + DATUM / 2, z1: front + 3 }, canopyUnder, canopyTop)
    const posts = [GRID_X[1], GRID_X[2]].map((x) => slab(grow({ x0: x, x1: x, z0: front + 2.7, z1: front + 2.7 }, 0.09), 0, canopyUnder))
    // Storefront transoms at door head, bay by bay; door frames on the lobby line.
    const doorHead = slabTop(0) + 2.3
    const frames: BoxSpec[] = []
    for (const f of faces(PODIUM, GRID_X, GRID_Z)) {
      for (let i = 0; i < f.lines.length - 1; i++) {
        if (isStreetFace(f) && i === ENTRANCE_BAY) continue
        const a0 = f.lines[i] + PIER / 2
        const a1 = f.lines[i + 1] - PIER / 2
        frames.push(onFace(f, (a0 + a1) / 2, doorHead, a1 - a0, 0.1, SKIN * 0.6))
      }
    }
    frames.push(slab({ ...lobby, z0: lobby.z0 - 0.08, z1: lobby.z0 + 0.08 }, doorHead - 0.06, doorHead + 0.06))
    for (const x of [-1.5, 1.5]) {
      frames.push(slab({ x0: x - 0.08, x1: x + 0.08, z0: lobby.z0 - 0.14, z1: lobby.z0 + 0.14 }, slabTop(0), doorHead))
    }
    const ceilings = [
      slab(grow(PODIUM, -0.45), slabTop(0) + CLEAR - HEAD - 0.04, slabTop(0) + CLEAR - HEAD),
      ...Array.from({ length: TOWER_FLOORS }, (_, i) =>
        slab(grow(TOWER, -0.45), slabTop(i + 1) + CLEAR - HEAD - 0.04, slabTop(i + 1) + CLEAR - HEAD),
      ),
    ]
    return { ahu, chillers, services, canopy, posts, frames, ceilings }
  }, [envelope])

  // Terrace planters on the podium roof: the usable datum the tower steps back from.
  const planters = useMemo(() => {
    const y = slabTop(1) + 0.08
    return [
      { x0: PODIUM.x0 + 1.2, x1: -3.2, z0: PODIUM.z1 - 1.6, z1: PODIUM.z1 - 0.7 },
      { x0: TOWER.x1 + 1.4, x1: PODIUM.x1 - 0.7, z0: GRID_Z[0] + 1.5, z1: GRID_Z[2] - 0.5 },
    ].map((r) => ({ r, box: slab(r, y, y + 0.5), y: y + 0.5 }))
  }, [])

  return (
    <group>
      <Layer visible={layers.foundations}>
        <Box {...foundations.blinding} material={m.blinding} />
        {boxes(foundations.pads, m.footing, "pad", true)}
        {boxes(foundations.pedestals, m.formwork, "ped")}
        <Instanced specs={foundations.plates} material={m.steel} />
        <Box {...foundations.raft} material={m.footing} edges />
        {boxes(foundations.kickers, m.formwork, "k")}
        <Instanced specs={foundations.starters} material={m.steel} />
      </Layer>

      <Layer visible={layers.massing}>{boxes(massing, m.mass, "m", true)}</Layer>

      <Layer visible={layers.structure}>
        {boxes(structure.slabs, m.concrete, "s", true)}
        <Instanced specs={structure.steel} material={m.steel} />
        <Box {...structure.core} material={m.formwork} edges />
        <Instanced specs={structure.openings} material={m.opening} />
      </Layer>

      <Layer visible={layers.envelope}>
        {boxes(envelope.bands, m.panel, "b")}
        {boxes(envelope.piers, m.panel, "p")}
        <Instanced specs={envelope.mullions} material={m.metal} />
        <Instanced specs={envelope.glass} material={m.glass} />
        {boxes(envelope.returns, m.panel, "rt")}
        <Box {...envelope.lobbySoffit} material={m.panel} />
        {boxes(envelope.datum, m.datum, "d", true)}
        <Instanced specs={envelope.copings} material={m.metal} />
        <Box {...envelope.ballast} material={m.gravel} />
        <Box {...envelope.terrace} material={m.paving} />
        <Instanced specs={envelope.louvres} material={m.metal} />
        <Box {...envelope.overrun} material={m.panel} edges />
        <Box {...envelope.overrunCap} material={m.metal} />
      </Layer>

      <Layer visible={layers.fitout}>
        <Instanced specs={fitout.ceilings} material={m.ceiling} />
        <Box {...fitout.ahu} material={m.plant} edges />
        {boxes(fitout.chillers, m.plant, "ch", true)}
        <Instanced specs={fitout.services} material={m.metal} />
        <Box {...fitout.canopy} material={m.panel} edges />
        <Instanced specs={fitout.posts} material={m.steel} />
        <Instanced specs={fitout.frames} material={m.steel} />
      </Layer>

      <Layer visible={layers.landscape}>
        {planters.map(({ r, box, y }, i) => (
          <group key={i}>
            <Box {...box} material={m.kerb} />
            <Shrubs x={(r.x0 + r.x1) / 2} z={(r.z0 + r.z1) / 2} width={r.x1 - r.x0} depth={r.z1 - r.z0} y={y - 0.2} seed={40 + i * 9} />
          </group>
        ))}
      </Layer>
    </group>
  )
}
