import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { CAMPUS_VOLUMES, type Mat } from "./campusVolumes"

const COLORS: Record<Mat, string> = {
  w: "#f2f2f0",
  o: "#e85a3c",
  c: "#5ec4c6",
  b: "#2a2a2c",
  p: "#2c4a38",
}

const ASSEMBLE = 0.08

export function CampusMassing({
  currentStep,
  reduced,
}: {
  currentStep: number
  reduced: boolean
}) {
  const groups = useRef<(THREE.Group | null)[]>([])
  const stepRef = useRef(currentStep)
  const reducedRef = useRef(reduced)
  stepRef.current = currentStep
  reducedRef.current = reduced

  useFrame((_, delta) => {
    const step = stepRef.current
    const snap = reducedRef.current
    const k = snap ? 1 : 1 - Math.pow(1 - ASSEMBLE, delta * 60)
    for (let i = 0; i < CAMPUS_VOLUMES.length; i += 1) {
      const group = groups.current[i]
      if (!group) continue
      const on = step >= CAMPUS_VOLUMES[i].reveal
      const target = on ? 1 : 0.001
      group.scale.y = THREE.MathUtils.lerp(group.scale.y, target, k)
      group.visible = group.scale.y > 0.02
    }
  })

  return (
    <group name="CampusMassing">
      {CAMPUS_VOLUMES.map((vol, i) => {
        const glass = vol.m === "c"
        const on = currentStep >= vol.reveal
        return (
          <group
            key={`${vol.g}-${i}`}
            ref={(node) => {
              groups.current[i] = node
            }}
            position={[vol.x, vol.y, vol.z]}
            scale={[1, reduced && on ? 1 : 0.001, 1]}
            visible={reduced ? on : undefined}
          >
            <mesh position={[0, vol.h / 2, 0]} castShadow={vol.m !== "b"} receiveShadow>
              <boxGeometry args={[vol.w, vol.h, vol.d]} />
              <meshStandardMaterial
                color={COLORS[vol.m]}
                roughness={glass ? 0.2 : vol.m === "o" ? 0.52 : 0.82}
                metalness={vol.m === "o" ? 0.06 : 0.03}
                transparent={glass}
                opacity={glass ? 0.7 : 1}
                depthWrite={!glass}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
