import { useMemo, useRef, type MutableRefObject } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh, MeshStandardMaterial, Object3D } from "three"
import {
  FLOOR_COUNT,
  PODIUM,
  SLAB,
  STOREY_HEIGHT,
  coreHeight,
  floorPhase,
  foundationProgress,
  roofProgress,
} from "./lifecycle"

type ProgressRef = MutableRefObject<number>

const CONCRETE = "#9A968E"
const FRESH = "#6F6C66"
const PLY = "#C9A56C"
const STEEL = "#2C2D2A"
const OXIDE = "#C2452D"
const PIT = "#3A3226"
const EARTH = "#4A4C46"

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function isMesh(object: Object3D): object is Mesh {
  return "isMesh" in object && (object as Mesh).isMesh === true
}

function isStandardMaterial(material: Mesh["material"]): material is MeshStandardMaterial {
  return !Array.isArray(material) && "isMeshStandardMaterial" in material && material.isMeshStandardMaterial === true
}

function setOpacity(group: Group | null, opacity: number, visible = opacity > 0.03) {
  if (!group) return
  group.visible = visible
  group.traverse((child) => {
    if (!isMesh(child) || !isStandardMaterial(child.material)) return
    child.material.transparent = opacity < 0.98
    child.material.opacity = opacity
    child.material.depthWrite = opacity > 0.6
  })
}

function Floor({
  index,
  progressRef,
}: {
  index: number
  progressRef: ProgressRef
}) {
  const rootRef = useRef<Group>(null)
  const formRef = useRef<Group>(null)
  const slabRef = useRef<Mesh>(null)
  const glazeRef = useRef<Group>(null)
  const nextFormRef = useRef<Group>(null)
  const y = PODIUM.t + index * STOREY_HEIGHT

  useFrame(() => {
    const phase = floorPhase(progressRef.current, index)
    if (rootRef.current) {
      rootRef.current.visible = phase.form > 0.02 || phase.pour > 0.02
    }
    const next = floorPhase(progressRef.current, index + 1)

    if (slabRef.current) {
      slabRef.current.visible = phase.pour > 0.02
      slabRef.current.scale.y = Math.max(0.04, phase.pour)
      slabRef.current.position.y = SLAB.t * 0.5 * phase.pour
      const mat = slabRef.current.material
      if (isStandardMaterial(mat)) {
        mat.roughness = lerp(0.4, 0.9, phase.strip)
        mat.metalness = lerp(0.16, 0.03, phase.strip)
        mat.color.set(phase.strip < 0.55 ? FRESH : CONCRETE)
        mat.transparent = phase.pour < 1
        mat.opacity = phase.pour
      }
    }

    setOpacity(formRef.current, phase.form * (1 - phase.strip))
    if (formRef.current) formRef.current.scale.y = Math.max(0.12, phase.form)

    const concurrent = index < FLOOR_COUNT - 1 ? next.form * 0.35 * (1 - next.pour) : 0
    setOpacity(nextFormRef.current, concurrent)

    setOpacity(glazeRef.current, phase.strip * 0.55)
  })

  return (
    <group ref={rootRef} position={[0, y, 0]} name={`Floor-${index}`}>
      <mesh ref={slabRef} castShadow receiveShadow>
        <boxGeometry args={[SLAB.w, SLAB.t, SLAB.d]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.88} />
      </mesh>
      <Columns index={index} progressRef={progressRef} />
      <group ref={glazeRef} name={`Glaze-${index}`}>
        <Glazing />
      </group>
      <group ref={formRef} name={`Form-${index}`}>
        <FormCage />
      </group>
      <group ref={nextFormRef} position={[0, STOREY_HEIGHT, 0]} name={`ConcurrentForm-${index}`}>
        <FormCage />
      </group>
    </group>
  )
}

function Glazing() {
  const h = STOREY_HEIGHT * 0.62
  const y = SLAB.t + h / 2 + 0.08
  return (
    <group>
      <mesh position={[0, y, SLAB.d / 2 - 0.02]}>
        <boxGeometry args={[SLAB.w * 0.92, h, 0.03]} />
        <meshStandardMaterial color="#8FA0A6" roughness={0.18} metalness={0.35} transparent opacity={0.28} />
      </mesh>
      <mesh position={[SLAB.w / 2 - 0.02, y, 0]}>
        <boxGeometry args={[0.03, h, SLAB.d * 0.88]} />
        <meshStandardMaterial color="#8FA0A6" roughness={0.18} metalness={0.35} transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

function FormCage() {
  const h = STOREY_HEIGHT * 0.88
  const t = 0.045
  return (
    <group>
      <mesh position={[0, h / 2 + SLAB.t, SLAB.d / 2 + t / 2]}>
        <boxGeometry args={[SLAB.w + 0.08, h, t]} />
        <meshStandardMaterial color={PLY} roughness={0.8} transparent />
      </mesh>
      <mesh position={[0, h / 2 + SLAB.t, -SLAB.d / 2 - t / 2]}>
        <boxGeometry args={[SLAB.w + 0.08, h, t]} />
        <meshStandardMaterial color={PLY} roughness={0.8} transparent />
      </mesh>
      <mesh position={[SLAB.w / 2 + t / 2, h / 2 + SLAB.t, 0]}>
        <boxGeometry args={[t, h, SLAB.d]} />
        <meshStandardMaterial color={PLY} roughness={0.8} transparent />
      </mesh>
      <mesh position={[-SLAB.w / 2 - t / 2, h / 2 + SLAB.t, 0]}>
        <boxGeometry args={[t, h, SLAB.d]} />
        <meshStandardMaterial color={PLY} roughness={0.8} transparent />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (SLAB.w / 2 + 0.08), h * 0.7, 0]}>
          <boxGeometry args={[0.04, 0.04, SLAB.d + 0.16]} />
          <meshStandardMaterial color={STEEL} metalness={0.45} roughness={0.4} transparent />
        </mesh>
      ))}
    </group>
  )
}

function Columns({
  index,
  progressRef,
}: {
  index: number
  progressRef: ProgressRef
}) {
  const group = useRef<Group>(null)
  const xs = useMemo(() => [-2.2, 2.2], [])
  const zs = useMemo(() => [-3.0, -1.0, 1.0, 3.0], [])

  useFrame(() => {
    const { pour } = floorPhase(progressRef.current, index)
    if (group.current) {
      group.current.visible = pour > 0.18
      group.current.scale.y = Math.max(0.06, pour)
    }
  })

  return (
    <group ref={group} position={[0, STOREY_HEIGHT * 0.5, 0]}>
      {xs.map((x) =>
        zs.map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0, z]} castShadow>
            <boxGeometry args={[0.28, STOREY_HEIGHT - SLAB.t, 0.28]} />
            <meshStandardMaterial color="#8B8882" roughness={0.86} />
          </mesh>
        )),
      )}
    </group>
  )
}

function Core({ progressRef }: { progressRef: ProgressRef }) {
  const shaft = useRef<Mesh>(null)
  const spine = useRef<Mesh>(null)

  useFrame(() => {
    const h = coreHeight(progressRef.current)
    if (shaft.current) {
      shaft.current.visible = progressRef.current > 0.1
      shaft.current.scale.y = Math.max(0.2, h)
      shaft.current.position.y = h / 2
    }
    if (spine.current) {
      const critical = Math.max(0.25, h * 0.94)
      spine.current.scale.y = critical
      spine.current.position.y = critical / 2
      spine.current.visible = progressRef.current > 0.28
    }
  })

  return (
    <group name="Cores" position={[0.15, 0, -2.15]}>
      <mesh ref={shaft} castShadow>
        <boxGeometry args={[1.85, 1, 2.35]} />
        <meshStandardMaterial color="#7A7771" roughness={0.82} />
      </mesh>
      <mesh ref={spine} position={[0.86, 0, 0.2]}>
        <boxGeometry args={[0.16, 1, 0.16]} />
        <meshStandardMaterial
          color={OXIDE}
          roughness={0.32}
          metalness={0.22}
          emissive={OXIDE}
          emissiveIntensity={0.28}
        />
      </mesh>
    </group>
  )
}

export function FormworkTower({ progressRef }: { progressRef: ProgressRef }) {
  const site = useRef<Group>(null)
  const foundation = useRef<Mesh>(null)
  const roof = useRef<Group>(null)
  const pit = useRef<Group>(null)

  useFrame((state) => {
    const p = progressRef.current
    if (site.current) {
      site.current.rotation.y = lerp(site.current.rotation.y, state.pointer.x * 0.12, 0.04)
      site.current.rotation.x = lerp(site.current.rotation.x, -state.pointer.y * 0.04, 0.04)
    }

    if (foundation.current) {
      const found = Math.max(0.35, foundationProgress(p))
      foundation.current.scale.set(found, 1, found)
      foundation.current.position.y = PODIUM.t / 2
    }

    if (pit.current) {
      pit.current.position.y = -2.05
    }

    if (roof.current) {
      const r = roofProgress(p)
      setOpacity(roof.current, r)
      roof.current.position.y = PODIUM.t + FLOOR_COUNT * STOREY_HEIGHT + 0.12
    }
  })

  const floors = useMemo(() => Array.from({ length: FLOOR_COUNT }, (_, i) => i), [])

  return (
    <group ref={site} name="Site">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 20]} receiveShadow>
        <planeGeometry args={[80, 26]} />
        <meshStandardMaterial color={EARTH} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]} receiveShadow>
        <planeGeometry args={[80, 26]} />
        <meshStandardMaterial color={EARTH} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[22, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 16]} />
        <meshStandardMaterial color={EARTH} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-22, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 16]} />
        <meshStandardMaterial color={EARTH} roughness={1} />
      </mesh>

      <group ref={pit} name="Excavation">
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[9.6, 0.1, 11.6]} />
          <meshStandardMaterial color={PIT} roughness={1} />
        </mesh>
        <mesh position={[0, 1, 5.9]} receiveShadow>
          <boxGeometry args={[10.2, 2.1, 0.45]} />
          <meshStandardMaterial color="#4A4034" roughness={1} />
        </mesh>
        <mesh position={[0, 1, -5.9]} receiveShadow>
          <boxGeometry args={[10.2, 2.1, 0.45]} />
          <meshStandardMaterial color="#4A4034" roughness={1} />
        </mesh>
        <mesh position={[5.1, 1, 0]} receiveShadow>
          <boxGeometry args={[0.45, 2.1, 11.6]} />
          <meshStandardMaterial color="#40382E" roughness={1} />
        </mesh>
        <mesh position={[-5.1, 1, 0]} receiveShadow>
          <boxGeometry args={[0.45, 2.1, 11.6]} />
          <meshStandardMaterial color="#40382E" roughness={1} />
        </mesh>
      </group>

      <mesh ref={foundation} name="Foundation" castShadow receiveShadow>
        <boxGeometry args={[PODIUM.w, PODIUM.t, PODIUM.d]} />
        <meshStandardMaterial color="#8A8680" roughness={0.94} />
      </mesh>

      <Core progressRef={progressRef} />

      <group name="Floors">
        {floors.map((index) => (
          <Floor key={index} index={index} progressRef={progressRef} />
        ))}
      </group>

      <group ref={roof} name="Roof">
        <mesh castShadow>
          <boxGeometry args={[SLAB.w * 0.96, 0.16, SLAB.d * 0.9]} />
          <meshStandardMaterial color="#6A6863" roughness={0.64} transparent />
        </mesh>
        <mesh position={[0.2, 0.46, -2.05]} castShadow>
          <boxGeometry args={[1.6, 0.76, 1.9]} />
          <meshStandardMaterial color="#585652" roughness={0.58} transparent />
        </mesh>
      </group>
    </group>
  )
}
