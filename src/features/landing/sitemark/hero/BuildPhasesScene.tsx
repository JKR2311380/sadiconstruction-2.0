import { Suspense, useEffect, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { BuildingMesh } from "./BuildingMesh"
import { Lighting } from "./Lighting"
import { Site } from "./Site"
import { CAMERA_CUT_S, PHASES, expoOut, layersFor } from "../phases"

const SURFACE = "#CAD6DD"

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

export function BuildPhasesScene({ phase, active }: { phase: number; active: boolean }) {
  const layers = layersFor(phase)
  return (
    <Canvas
      className="sm-hero__canvas"
      frameloop={active ? "demand" : "never"}
      dpr={[1, 2]}
      shadows
      camera={{ fov: 32, near: 0.5, far: 260, position: PHASES[phase].camera.position }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[SURFACE]} />
      <fog attach="fog" args={[SURFACE, 60, 140]} />
      <Suspense fallback={null}>
        <Lighting />
        <Rig phase={phase} />
        <Site excavated={layers.foundations} landscaped={layers.landscape} />
        <BuildingMesh phase={phase} />
      </Suspense>
    </Canvas>
  )
}
