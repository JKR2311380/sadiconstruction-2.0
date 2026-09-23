import { Suspense, useEffect, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { ContactShadows, Line } from "@react-three/drei"
import * as THREE from "three"
import { BuildingMesh } from "./BuildingMesh"
import { CAMERA_CUT_S, PHASES, expoOut } from "../phases"

const SURFACE = "#E2E7E5"
const INK = "#0E1210"

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

function Site() {
  const plot: [number, number, number][] = [
    [-13, 0.02, -10],
    [13, 0.02, -10],
    [13, 0.02, 12],
    [-13, 0.02, 12],
    [-13, 0.02, -10],
  ]
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color={SURFACE} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 1]} receiveShadow>
        <planeGeometry args={[26, 22]} />
        <meshStandardMaterial color="#D8DEDB" roughness={1} />
      </mesh>
      <Line points={plot} color={INK} lineWidth={1.2} dashed dashSize={0.6} gapSize={0.4} />
    </group>
  )
}

export function BuildPhasesScene({ phase, active }: { phase: number; active: boolean }) {
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
      <hemisphereLight args={["#FFFFFF", "#9AA6A1", 0.9]} />
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0004}
      />
      <Suspense fallback={null}>
        <Rig phase={phase} />
        <Site />
        <BuildingMesh phase={phase} />
        <ContactShadows position={[0, 0.02, 0]} opacity={0.28} scale={40} blur={2.6} far={14} />
      </Suspense>
    </Canvas>
  )
}
