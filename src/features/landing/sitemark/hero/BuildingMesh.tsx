import { useMemo, useRef, type ReactNode } from "react"
import { useFrame } from "@react-three/fiber"
import { Edges } from "@react-three/drei"
import * as THREE from "three"
import { expoOut, layersFor } from "../phases"

const FLOOR_H = 3
const SLAB_T = 0.3
const INK = "#0E1210"

const PODIUM = { w: 16, d: 11, cx: 0, cz: 0 }
const TOWER = { w: 12, d: 8, cx: -1.5, cz: -1, floors: 3 }

type Vec3 = [number, number, number]
interface BoxSpec {
  pos: Vec3
  size: Vec3
}

function Box({ pos, size, material, edges = true }: BoxSpec & { material: THREE.Material; edges?: boolean }) {
  return (
    <mesh position={pos} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
      {edges && <Edges color={INK} threshold={20} />}
    </mesh>
  )
}

function range(start: number, end: number, step: number) {
  const out: number[] = []
  for (let v = start; v <= end + 1e-6; v += step) out.push(v)
  return out
}

/** Piers, sill band and head band per face — openings are the gaps between them. */
function facade(w: number, d: number, cx: number, cz: number, y0: number, bay: number): BoxSpec[] {
  const t = 0.26
  const sill = 1.05
  const head = 0.55
  const pier = 0.34
  const h = FLOOR_H - SLAB_T
  const specs: BoxSpec[] = []
  const faces: Array<{ len: number; along: "x" | "z"; fixed: number }> = [
    { len: w, along: "x", fixed: cz + d / 2 },
    { len: w, along: "x", fixed: cz - d / 2 },
    { len: d, along: "z", fixed: cx + w / 2 },
    { len: d, along: "z", fixed: cx - w / 2 },
  ]
  for (const face of faces) {
    const centre = face.along === "x" ? cx : cz
    const place = (a: number, y: number, len: number, height: number): BoxSpec =>
      face.along === "x"
        ? { pos: [a, y, face.fixed], size: [len, height, t] }
        : { pos: [face.fixed, y, a], size: [t, height, len] }
    specs.push(place(centre, y0 + sill / 2, face.len + t, sill))
    specs.push(place(centre, y0 + h - head / 2, face.len + t, head))
    for (const a of range(centre - face.len / 2, centre + face.len / 2, bay)) {
      specs.push(place(a, y0 + sill + (h - sill - head) / 2, pier, h - sill - head))
    }
  }
  return specs
}

function glazing(w: number, d: number, cx: number, cz: number, y0: number, sill: number, head: number): BoxSpec[] {
  const h = FLOOR_H - SLAB_T - sill - head
  const y = y0 + sill + h / 2
  return [
    { pos: [cx, y, cz + d / 2 - 0.05], size: [w - 0.1, h, 0.06] },
    { pos: [cx, y, cz - d / 2 + 0.05], size: [w - 0.1, h, 0.06] },
    { pos: [cx + w / 2 - 0.05, y, cz], size: [0.06, h, d - 0.1] },
    { pos: [cx - w / 2 + 0.05, y, cz], size: [0.06, h, d - 0.1] },
  ]
}

function useMaterials() {
  return useMemo(
    () => ({
      mass: new THREE.MeshStandardMaterial({ color: "#C8CFCB", roughness: 0.95 }),
      slab: new THREE.MeshStandardMaterial({ color: "#D6DAD6", roughness: 0.9 }),
      column: new THREE.MeshStandardMaterial({ color: "#3E5A6C", roughness: 0.55, metalness: 0.35 }),
      core: new THREE.MeshStandardMaterial({ color: "#BCC3BF", roughness: 0.85 }),
      panel: new THREE.MeshStandardMaterial({ color: "#E8EEF0", roughness: 0.75 }),
      glass: new THREE.MeshStandardMaterial({ color: "#5A7385", roughness: 0.2, metalness: 0.35 }),
      plant: new THREE.MeshStandardMaterial({ color: "#4A6575", roughness: 0.65, metalness: 0.25 }),
    }),
    [],
  )
}

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
  const m = useMaterials()
  const layers = layersFor(phase)

  const structure = useMemo(() => {
    const slabs: BoxSpec[] = [
      { pos: [PODIUM.cx, SLAB_T / 2, PODIUM.cz], size: [PODIUM.w + 0.6, SLAB_T, PODIUM.d + 0.6] },
      { pos: [PODIUM.cx, FLOOR_H, PODIUM.cz], size: [PODIUM.w + 0.3, SLAB_T, PODIUM.d + 0.3] },
    ]
    for (let f = 2; f <= TOWER.floors + 1; f++) {
      slabs.push({ pos: [TOWER.cx, f * FLOOR_H, TOWER.cz], size: [TOWER.w + 0.3, SLAB_T, TOWER.d + 0.3] })
    }
    const columns: BoxSpec[] = []
    for (const x of range(-PODIUM.w / 2 + 0.4, PODIUM.w / 2 - 0.4, (PODIUM.w - 0.8) / 4)) {
      for (const z of range(-PODIUM.d / 2 + 0.4, PODIUM.d / 2 - 0.4, (PODIUM.d - 0.8) / 3)) {
        columns.push({ pos: [x, FLOOR_H / 2, z], size: [0.42, FLOOR_H, 0.42] })
      }
    }
    for (let f = 1; f <= TOWER.floors; f++) {
      for (const x of range(TOWER.cx - TOWER.w / 2 + 0.4, TOWER.cx + TOWER.w / 2 - 0.4, (TOWER.w - 0.8) / 3)) {
        for (const z of range(TOWER.cz - TOWER.d / 2 + 0.4, TOWER.cz + TOWER.d / 2 - 0.4, (TOWER.d - 0.8) / 2)) {
          columns.push({ pos: [x, f * FLOOR_H + FLOOR_H / 2, z], size: [0.38, FLOOR_H, 0.38] })
        }
      }
    }
    const core: BoxSpec = { pos: [TOWER.cx - 2, (FLOOR_H * 4 + 1.6) / 2, TOWER.cz], size: [3, FLOOR_H * 4 + 1.6, 3.4] }
    return { slabs, columns, core }
  }, [])

  const envelope = useMemo(() => {
    const panels: BoxSpec[] = []
    for (let f = 1; f <= TOWER.floors; f++) {
      panels.push(...facade(TOWER.w, TOWER.d, TOWER.cx, TOWER.cz, f * FLOOR_H + SLAB_T / 2, 2))
    }
    const t = 0.26
    const h = FLOOR_H - SLAB_T
    const podiumPiers: BoxSpec[] = []
    for (const x of range(-PODIUM.w / 2, PODIUM.w / 2, 4)) {
      podiumPiers.push({ pos: [x, SLAB_T + h / 2, PODIUM.d / 2], size: [0.5, h, t] })
      podiumPiers.push({ pos: [x, SLAB_T + h / 2, -PODIUM.d / 2], size: [0.5, h, t] })
    }
    for (const z of range(-PODIUM.d / 2, PODIUM.d / 2, PODIUM.d / 3)) {
      podiumPiers.push({ pos: [PODIUM.w / 2, SLAB_T + h / 2, z], size: [t, h, 0.5] })
      podiumPiers.push({ pos: [-PODIUM.w / 2, SLAB_T + h / 2, z], size: [t, h, 0.5] })
    }
    const fascia: BoxSpec = { pos: [0, FLOOR_H - 0.35, 0], size: [PODIUM.w + 0.5, 0.7, PODIUM.d + 0.5] }
    const roofZ = TOWER.floors + 1
    const parapet: BoxSpec[] = [
      { pos: [TOWER.cx, roofZ * FLOOR_H + 0.5, TOWER.cz + TOWER.d / 2], size: [TOWER.w + 0.3, 0.7, 0.22] },
      { pos: [TOWER.cx, roofZ * FLOOR_H + 0.5, TOWER.cz - TOWER.d / 2], size: [TOWER.w + 0.3, 0.7, 0.22] },
      { pos: [TOWER.cx + TOWER.w / 2, roofZ * FLOOR_H + 0.5, TOWER.cz], size: [0.22, 0.7, TOWER.d + 0.3] },
      { pos: [TOWER.cx - TOWER.w / 2, roofZ * FLOOR_H + 0.5, TOWER.cz], size: [0.22, 0.7, TOWER.d + 0.3] },
    ]
    return { panels, podiumPiers, fascia, parapet }
  }, [])

  const fitout = useMemo(() => {
    const glass: BoxSpec[] = []
    for (let f = 1; f <= TOWER.floors; f++) {
      glass.push(...glazing(TOWER.w, TOWER.d, TOWER.cx, TOWER.cz, f * FLOOR_H + SLAB_T / 2, 1.05, 0.55))
    }
    glass.push(...glazing(PODIUM.w - 0.2, PODIUM.d - 0.2, 0, 0, SLAB_T, 0, 0.7))
    const roofY = (TOWER.floors + 1) * FLOOR_H + SLAB_T / 2
    const plant: BoxSpec[] = [
      { pos: [TOWER.cx + 2.6, roofY + 0.7, TOWER.cz - 1], size: [3.2, 1.4, 2.2] },
      { pos: [TOWER.cx + 2.6, roofY + 0.45, TOWER.cz + 2], size: [2.2, 0.9, 1.4] },
      { pos: [TOWER.cx + 5.1, roofY + 0.55, TOWER.cz - 1.2], size: [1, 1.1, 1] },
    ]
    const canopy: BoxSpec = { pos: [3.2, FLOOR_H - 0.55, PODIUM.d / 2 + 1.6], size: [6, 0.22, 3.2] }
    const canopyPosts: BoxSpec[] = [
      { pos: [0.6, (FLOOR_H - 0.55) / 2, PODIUM.d / 2 + 2.9], size: [0.18, FLOOR_H - 0.55, 0.18] },
      { pos: [5.8, (FLOOR_H - 0.55) / 2, PODIUM.d / 2 + 2.9], size: [0.18, FLOOR_H - 0.55, 0.18] },
    ]
    return { glass, plant, canopy, canopyPosts }
  }, [])

  return (
    <group>
      <Layer visible={layers.massing}>
        <Box pos={[0, FLOOR_H / 2, 0]} size={[PODIUM.w, FLOOR_H, PODIUM.d]} material={m.mass} />
        <Box
          pos={[TOWER.cx, FLOOR_H + (TOWER.floors * FLOOR_H) / 2, TOWER.cz]}
          size={[TOWER.w, TOWER.floors * FLOOR_H, TOWER.d]}
          material={m.mass}
        />
      </Layer>

      <Layer visible={layers.structure}>
        {structure.slabs.map((spec, i) => (
          <Box key={`s${i}`} {...spec} material={m.slab} />
        ))}
        {structure.columns.map((spec, i) => (
          <Box key={`c${i}`} {...spec} material={m.column} edges={false} />
        ))}
        <Box {...structure.core} material={m.core} />
      </Layer>

      <Layer visible={layers.envelope}>
        {envelope.panels.map((spec, i) => (
          <Box key={`p${i}`} {...spec} material={m.panel} />
        ))}
        {envelope.podiumPiers.map((spec, i) => (
          <Box key={`pp${i}`} {...spec} material={m.panel} />
        ))}
        <Box {...envelope.fascia} material={m.panel} />
        {envelope.parapet.map((spec, i) => (
          <Box key={`r${i}`} {...spec} material={m.panel} />
        ))}
      </Layer>

      <Layer visible={layers.fitout}>
        {fitout.glass.map((spec, i) => (
          <Box key={`g${i}`} {...spec} material={m.glass} edges={false} />
        ))}
        {fitout.plant.map((spec, i) => (
          <Box key={`pl${i}`} {...spec} material={m.plant} />
        ))}
        <Box {...fitout.canopy} material={m.slab} />
        {fitout.canopyPosts.map((spec, i) => (
          <Box key={`cp${i}`} {...spec} material={m.column} edges={false} />
        ))}
      </Layer>
    </group>
  )
}
