import { useMemo } from "react"
import { Line } from "@react-three/drei"
import * as THREE from "three"
import { EXCAVATION, FOOTPRINT, type Rect } from "./BuildingMesh"
import { siteMaterials } from "./materials"
import { Shrubs, Tree } from "./Planting"

const INK = "#0E1210"

type Vec3 = [number, number, number]

/* Plot and street, in metres. The entrance faces the street on +z. */
const PLOT: Rect = { x0: -13, x1: 13, z0: -10, z1: 12 }
const FOOTPATH = { z0: PLOT.z1, z1: 15 }
const KERB = 0.15
const ROAD = { z0: FOOTPATH.z1 + KERB, z1: 23, y: -0.14 }
const FAR = 80

/** Plan rectangle to a horizontal ShapeGeometry in world XZ, optionally with one hole. */
function ground(outer: Rect, hole?: Rect) {
  const trace = (path: THREE.Path, r: Rect) => {
    path.moveTo(r.x0, -r.z0)
    path.lineTo(r.x1, -r.z0)
    path.lineTo(r.x1, -r.z1)
    path.lineTo(r.x0, -r.z1)
    path.closePath()
  }
  const shape = new THREE.Shape()
  trace(shape, outer)
  if (hole) {
    const cut = new THREE.Path()
    trace(cut, hole)
    shape.holes.push(cut)
  }
  return new THREE.ShapeGeometry(shape)
}

/** Battered side walls and formation floor of the cut, UV'd in plan metres. */
function pitGeometry() {
  const { floor: b, top: t, depth } = EXCAVATION
  const low: Vec3[] = [
    [b.x0, -depth, b.z0],
    [b.x1, -depth, b.z0],
    [b.x1, -depth, b.z1],
    [b.x0, -depth, b.z1],
  ]
  const high: Vec3[] = [
    [t.x0, 0, t.z0],
    [t.x1, 0, t.z0],
    [t.x1, 0, t.z1],
    [t.x0, 0, t.z1],
  ]
  const pos: number[] = []
  const quad = (a: Vec3, b: Vec3, c: Vec3, d: Vec3) => pos.push(...a, ...b, ...c, ...a, ...c, ...d)
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    quad(low[i], low[j], high[j], high[i])
  }
  quad(low[0], low[1], low[2], low[3])
  const uv: number[] = []
  for (let i = 0; i < pos.length; i += 3) uv.push(pos[i], pos[i + 2])
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  geometry.computeVertexNormals()
  return geometry
}

function Flat({ geometry, material, y }: { geometry: THREE.BufferGeometry; material: THREE.Material; y: number }) {
  return <mesh geometry={geometry} material={material} rotation-x={-Math.PI / 2} position={[0, y, 0]} receiveShadow />
}

function Block({ r, y0, y1, material }: { r: Rect; y0: number; y1: number; material: THREE.Material }) {
  return (
    <mesh position={[(r.x0 + r.x1) / 2, (y0 + y1) / 2, (r.z0 + r.z1) / 2]} material={material} castShadow receiveShadow>
      <boxGeometry args={[r.x1 - r.x0, y1 - y0, r.z1 - r.z0]} />
    </mesh>
  )
}

function StreetLight({ x }: { x: number }) {
  const m = siteMaterials()
  const z = FOOTPATH.z1 - 0.5
  return (
    <group position={[x, 0, z]}>
      <mesh material={m.metal} position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 6.4, 8]} />
      </mesh>
      <mesh material={m.metal} position={[0, 6.35, 0.7]} castShadow>
        <boxGeometry args={[0.08, 0.06, 1.4]} />
      </mesh>
      <mesh material={m.steel} position={[0, 6.28, 1.35]} castShadow>
        <boxGeometry args={[0.28, 0.1, 0.5]} />
      </mesh>
    </group>
  )
}

/** Planter beds either side of the entrance approach, kerbed, with trees and shrubs. */
const BEDS: Rect[] = [
  { x0: PLOT.x0 + 0.6, x1: -4.2, z0: FOOTPRINT.z1 + 3.4, z1: PLOT.z1 - 0.5 },
  { x0: 4.2, x1: PLOT.x1 - 0.6, z0: FOOTPRINT.z1 + 3.4, z1: PLOT.z1 - 0.5 },
]

export function Site({ excavated, landscaped }: { excavated: boolean; landscaped: boolean }) {
  const m = siteMaterials()
  const g = useMemo(
    () => ({
      near: ground({ x0: -FAR, x1: FAR, z0: -FAR, z1: FOOTPATH.z1 }, EXCAVATION.top),
      far: ground({ x0: -FAR, x1: FAR, z0: ROAD.z1 + KERB, z1: FAR }),
      farPath: ground({ x0: -FAR, x1: FAR, z0: ROAD.z1 + KERB, z1: ROAD.z1 + KERB + 3 }),
      road: ground({ x0: -FAR, x1: FAR, z0: ROAD.z0, z1: ROAD.z1 }),
      plot: ground(PLOT, EXCAVATION.top),
      cap: ground(EXCAVATION.top),
      pit: pitGeometry(),
      path: ground({ x0: -FAR, x1: FAR, ...FOOTPATH }),
      paving: ground(PLOT),
    }),
    [],
  )
  const dashes = useMemo(() => {
    const out: number[] = []
    for (let x = -FAR + 2; x < FAR; x += 6) out.push(x)
    return out
  }, [])
  const boundary: Vec3[] = [
    [PLOT.x0, 0.03, PLOT.z0],
    [PLOT.x1, 0.03, PLOT.z0],
    [PLOT.x1, 0.03, PLOT.z1],
    [PLOT.x0, 0.03, PLOT.z1],
    [PLOT.x0, 0.03, PLOT.z0],
  ]
  const roadMid = (ROAD.z0 + ROAD.z1) / 2

  return (
    <group>
      <Flat geometry={g.near} material={m.ground} y={-0.01} />
      <Flat geometry={g.plot} material={m.site} y={0.005} />
      {excavated ? (
        <mesh geometry={g.pit} material={m.earth} receiveShadow />
      ) : (
        <Flat geometry={g.cap} material={m.site} y={0.005} />
      )}

      {/* Street: footpath, kerbs either side, carriageway with a dashed centre line. */}
      <Flat geometry={g.path} material={m.paving} y={0.012} />
      <Block r={{ x0: -FAR, x1: FAR, z0: FOOTPATH.z1, z1: ROAD.z0 }} y0={ROAD.y} y1={0.02} material={m.kerb} />
      <Flat geometry={g.road} material={m.asphalt} y={ROAD.y} />
      <Block r={{ x0: -FAR, x1: FAR, z0: ROAD.z1, z1: ROAD.z1 + KERB }} y0={ROAD.y} y1={0.02} material={m.kerb} />
      <Flat geometry={g.far} material={m.ground} y={-0.01} />
      <Flat geometry={g.farPath} material={m.paving} y={0.012} />
      {dashes.map((x) => (
        <Block key={x} r={{ x0: x, x1: x + 3, z0: roadMid - 0.06, z1: roadMid + 0.06 }} y0={ROAD.y} y1={ROAD.y + 0.006} material={m.marking} />
      ))}
      {[-27, -19, 19, 27].map((x, i) => (
        <group key={x}>
          <Block r={{ x0: x - 0.6, x1: x + 0.6, z0: 13.2, z1: 14.4 }} y0={0} y1={0.02} material={m.metal} />
          <Tree x={x} z={13.8} height={6.2} seed={i + 1} />
        </group>
      ))}
      {[-17, 17].map((x) => (
        <StreetLight key={x} x={x} />
      ))}

      {landscaped && (
        <group>
          <Flat geometry={g.paving} material={m.paving} y={0.014} />
          {BEDS.map((bed, i) => {
            const cx = (bed.x0 + bed.x1) / 2
            const cz = (bed.z0 + bed.z1) / 2
            return (
              <group key={i}>
                <Block r={bed} y0={0} y1={0.4} material={m.kerb} />
                <Block r={{ x0: bed.x0 + 0.15, x1: bed.x1 - 0.15, z0: bed.z0 + 0.15, z1: bed.z1 - 0.15 }} y0={0.4} y1={0.42} material={m.planting} />
                <Shrubs x={cx} z={cz} width={bed.x1 - bed.x0 - 0.6} depth={bed.z1 - bed.z0 - 0.6} y={0.4} seed={i * 17} />
                {[0.25, 0.72].map((f, k) => (
                  <Tree key={k} x={bed.x0 + (bed.x1 - bed.x0) * f} z={cz} height={4.6} seed={10 + i * 2 + k} y={0.4} />
                ))}
              </group>
            )
          })}
        </group>
      )}

      <Line points={boundary} color={INK} lineWidth={1} dashed dashSize={0.6} gapSize={0.4} transparent opacity={0.6} />
    </group>
  )
}
