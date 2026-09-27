import { Suspense, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { ContactShadows, Line } from "@react-three/drei"
import * as THREE from "three"
import { BuildingMesh, EXCAVATION, type Rect } from "./BuildingMesh"
import { CAMERA_CUT_S, PHASES, expoOut, layersFor } from "../phases"

const SURFACE = "#CAD6DD"
const GROUND = "#D6DAD6"
const PAD = "#BCC3BF"
const EARTH = "#6B5A47"
const INK = "#0E1210"

type Vec3 = [number, number, number]

/** Portrait planes need the camera further out to keep the whole footprint in frame. */
function framingScale(aspect: number) {
  return aspect >= 1 ? 1 : Math.min(1.45, 0.92 / aspect)
}

function Rig({ phase }: { phase: number }) {
  const { camera, invalidate, size } = useThree()
  const target = useRef(new THREE.Vector3(...PHASES[phase].camera.target))
  const from = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3() })
  const to = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3() })
  const cut = useRef<{ running: boolean; start: number | null }>({ running: false, start: null })
  const first = useRef(true)
  const scale = Math.max(1, framingScale(size.width / Math.max(1, size.height)))
  const lastScale = useRef(scale)

  useEffect(() => {
    const next = PHASES[phase].camera
    to.current.target.set(...next.target)
    to.current.pos.set(...next.position).sub(to.current.target).multiplyScalar(scale).add(to.current.target)
    const rescaled = lastScale.current !== scale
    lastScale.current = scale
    if (first.current || rescaled) {
      first.current = false
      camera.position.copy(to.current.pos)
      target.current.copy(to.current.target)
      camera.lookAt(target.current)
      invalidate()
      return
    }
    from.current.pos.copy(camera.position)
    from.current.target.copy(target.current)
    cut.current = { running: true, start: null }
    invalidate()
  }, [phase, camera, invalidate, scale])

  useFrame((state) => {
    if (!cut.current.running) return
    const now = state.clock.getElapsedTime()
    if (cut.current.start === null) cut.current.start = now
    const t = Math.min(1, (now - cut.current.start) / CAMERA_CUT_S)
    const k = expoOut(t)
    camera.position.lerpVectors(from.current.pos, to.current.pos, k)
    target.current.lerpVectors(from.current.target, to.current.target, k)
    camera.lookAt(target.current)
    if (t < 1) state.invalidate()
    else cut.current.running = false
  })

  return null
}

const PLOT: Rect = { x0: -13, x1: 13, z0: -10, z1: 12 }

/** Ground plane in world XZ with the excavation cut out of it. */
function holedGround(outer: Rect, hole: Rect) {
  const trace = (path: THREE.Path, r: Rect) => {
    path.moveTo(r.x0, -r.z0)
    path.lineTo(r.x1, -r.z0)
    path.lineTo(r.x1, -r.z1)
    path.lineTo(r.x0, -r.z1)
    path.closePath()
  }
  const shape = new THREE.Shape()
  trace(shape, outer)
  const cut = new THREE.Path()
  trace(cut, hole)
  shape.holes.push(cut)
  return new THREE.ShapeGeometry(shape)
}

/** Battered side walls and formation floor of the cut. */
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
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
  geometry.computeVertexNormals()
  return geometry
}

function Site({ excavated }: { excavated: boolean }) {
  const { ground, plot, pit } = useMemo(
    () => ({
      ground: holedGround({ x0: -80, x1: 80, z0: -80, z1: 80 }, EXCAVATION.top),
      plot: holedGround(PLOT, EXCAVATION.top),
      pit: pitGeometry(),
    }),
    [],
  )
  const top = EXCAVATION.top
  const boundary: Vec3[] = [
    [PLOT.x0, 0.02, PLOT.z0],
    [PLOT.x1, 0.02, PLOT.z0],
    [PLOT.x1, 0.02, PLOT.z1],
    [PLOT.x0, 0.02, PLOT.z1],
    [PLOT.x0, 0.02, PLOT.z0],
  ]
  return (
    <group>
      <mesh geometry={ground} rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>
      <mesh geometry={plot} rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} receiveShadow>
        <meshStandardMaterial color={PAD} roughness={1} />
      </mesh>
      {excavated ? (
        <mesh geometry={pit} receiveShadow>
          <meshStandardMaterial color={EARTH} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ) : (
        <mesh
          rotation-x={-Math.PI / 2}
          position={[(top.x0 + top.x1) / 2, 0.005, (top.z0 + top.z1) / 2]}
          receiveShadow
        >
          <planeGeometry args={[top.x1 - top.x0, top.z1 - top.z0]} />
          <meshStandardMaterial color={PAD} roughness={1} />
        </mesh>
      )}
      <Line points={boundary} color={INK} lineWidth={1.2} dashed dashSize={0.6} gapSize={0.4} />
    </group>
  )
}

export function BuildPhasesScene({ phase, active }: { phase: number; active: boolean }) {
  const excavated = layersFor(phase).foundations
  return (
    <Canvas
      className="sm-hero__canvas"
      frameloop={active ? "demand" : "never"}
      dpr={[1, 2]}
      shadows
      camera={{ fov: 32, near: 0.5, far: 260, position: PHASES[phase].camera.position }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[SURFACE]} />
      <fog attach="fog" args={[SURFACE, 60, 140]} />
      <hemisphereLight args={["#E8EEF2", "#8A9AA3", 0.9]} />
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.6}
        color="#FFF3DC"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.4} color="#3E5A6C" />
      <Suspense fallback={null}>
        <Rig phase={phase} />
        <Site excavated={excavated} />
        <BuildingMesh phase={phase} />
        {!excavated && <ContactShadows position={[0, 0.02, 0]} opacity={0.28} scale={40} blur={2.6} far={14} />}
      </Suspense>
    </Canvas>
  )
}
