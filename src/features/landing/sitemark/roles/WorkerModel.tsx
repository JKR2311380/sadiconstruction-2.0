/**
 * Roles figure — Kenney Mini Characters (CC0), see public/models/CREDITS.md.
 *
 * Keep Kenney materials (remap-to-flat broke this skin). Role difference = props +
 * slight root yaw from ROLE_LOOKS. No AnimationMixer (clips corrupt the bind).
 */
import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import type { Group, Mesh } from "three"
import type { RoleId } from "../Mascot"
import { PROP_OFFSETS, ROLE_LOOKS, SITE_PALETTE, type RolePropId } from "./roleLook"

const MODEL = "/models/worker.glb?v=textured"
const MORPH_S = 0.3
const ALL_PROPS: RolePropId[] = ["hardhat", "tablet", "board"]

function HardHat() {
  return (
    <group>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.09, 16]} />
        <meshStandardMaterial color={SITE_PALETTE.amber} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.01, 0.09]} castShadow>
        <boxGeometry args={[0.24, 0.025, 0.1]} />
        <meshStandardMaterial color={SITE_PALETTE.amber} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.05, 0.06, 0.03]} />
        <meshStandardMaterial color={SITE_PALETTE.ink} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Tablet({ accent }: { accent: string }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.014, 0.26]} />
        <meshStandardMaterial color={SITE_PALETTE.paper} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.009, 0]}>
        <boxGeometry args={[0.17, 0.004, 0.22]} />
        <meshStandardMaterial color={SITE_PALETTE.steelSoft} roughness={0.85} />
      </mesh>
      <mesh position={[-0.03, 0.012, 0.05]}>
        <boxGeometry args={[0.09, 0.006, 0.022]} />
        <meshStandardMaterial color={SITE_PALETTE.ink} />
      </mesh>
      <mesh position={[0.01, 0.012, 0.01]}>
        <boxGeometry args={[0.11, 0.006, 0.022]} />
        <meshStandardMaterial color={SITE_PALETTE.ink} />
      </mesh>
      <mesh position={[-0.01, 0.013, -0.04]}>
        <boxGeometry args={[0.1, 0.008, 0.024]} />
        <meshStandardMaterial color={accent} />
      </mesh>
    </group>
  )
}

function Board({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, -0.28, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.6, 8]} />
        <meshStandardMaterial color={SITE_PALETTE.steel} roughness={0.7} />
      </mesh>
      <mesh position={[0.08, -0.28, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.6, 8]} />
        <meshStandardMaterial color={SITE_PALETTE.steel} roughness={0.7} />
      </mesh>
      <mesh position={[0.04, 0.12, 0]} castShadow>
        <boxGeometry args={[0.36, 0.28, 0.028]} />
        <meshStandardMaterial color={SITE_PALETTE.paper} roughness={0.8} />
      </mesh>
      <mesh position={[-0.05, 0.16, 0.016]}>
        <boxGeometry args={[0.07, 0.018, 0.01]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <mesh position={[0.03, 0.1, 0.016]}>
        <boxGeometry args={[0.1, 0.018, 0.01]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <mesh position={[0.08, 0.04, 0.016]}>
        <boxGeometry args={[0.07, 0.018, 0.01]} />
        <meshStandardMaterial color={accent} />
      </mesh>
    </group>
  )
}

export function WorkerModel({
  role,
  reduced,
  onReady,
}: {
  role: RoleId
  reduced: boolean
  onReady?: () => void
}) {
  const look = ROLE_LOOKS[role]
  const root = useRef<Group>(null)
  const propRefs = useRef<Partial<Record<RolePropId, Group | null>>>({})
  const morph = useRef(1)
  const activeProps = useRef(new Set(look.props))
  const prevRole = useRef(role)
  const readyOnce = useRef(false)
  const { scene } = useGLTF(MODEL, false, true)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)
    scene.scale.set(1, 1, 1)
    scene.traverse((o) => {
      const mesh = o as Mesh
      if (mesh.isMesh) {
        mesh.frustumCulled = false
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    if (!readyOnce.current) {
      readyOnce.current = true
      onReady?.()
    }
    invalidate()
  }, [scene, onReady, invalidate])

  useEffect(() => {
    if (prevRole.current !== role) {
      morph.current = reduced ? 1 : 0
      prevRole.current = role
    }
    activeProps.current = new Set(look.props)
    invalidate()
  }, [look.props, role, reduced, invalidate])

  useFrame((_, dt) => {
    if (!reduced && morph.current < 1) {
      morph.current = Math.min(1, morph.current + dt / MORPH_S)
    } else if (reduced) {
      morph.current = 1
    }

    const g = root.current
    if (g) {
      g.position.set(...look.root.position)
      g.rotation.set(...look.root.rotation)
      g.scale.setScalar(look.scale)
    }

    const t = morph.current
    for (const id of ALL_PROPS) {
      const node = propRefs.current[id]
      if (!node) continue
      const on = activeProps.current.has(id)
      const show = id === "hardhat" ? 1 : on ? t : 1 - t
      node.visible = show > 0.04
      node.scale.setScalar(0.85 + 0.15 * show)
      const offset = PROP_OFFSETS[id]
      node.position.set(...offset.position)
      node.rotation.set(...offset.rotation)
    }
  })

  return (
    <group ref={root} position={look.root.position} rotation={look.root.rotation} scale={look.scale}>
      <primitive object={scene} />
      {ALL_PROPS.map((id) => {
        const offset = PROP_OFFSETS[id]
        return (
          <group
            key={id}
            ref={(el) => {
              propRefs.current[id] = el
            }}
            position={offset.position}
            rotation={offset.rotation}
          >
            {id === "hardhat" && <HardHat />}
            {id === "tablet" && <Tablet accent={SITE_PALETTE.mark} />}
            {id === "board" && <Board accent={SITE_PALETTE.mark} />}
          </group>
        )
      })}
    </group>
  )
}
