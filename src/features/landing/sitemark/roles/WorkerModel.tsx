/**
 * Roles figure — Kenney Mini Characters (CC0), see public/models/CREDITS.md.
 * Quaternius Worker was the preferred source but is API-gated on poly.pizza.
 */
import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useAnimations, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js"
import type { RoleId } from "../Mascot"

const MODEL = "/models/worker.glb"

const CLIPS: Record<RoleId, string> = {
  planner: "holding-both",
  pm: "emote-yes",
}

function HardHat() {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.14, 16]} />
        <meshStandardMaterial color="#E2A33B" roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.02, 0.15]} castShadow>
        <boxGeometry args={[0.36, 0.04, 0.16]} />
        <meshStandardMaterial color="#E2A33B" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.08, 0.1, 0.05]} />
        <meshStandardMaterial color="#0E1210" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Tablet() {
  return (
    <group position={[0.28, 0.4, 0.35]} rotation={[-1.0, 0.1, 0.15]}>
      <mesh castShadow>
        <boxGeometry args={[0.32, 0.02, 0.42]} />
        <meshStandardMaterial color="#EEF1F0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.28, 0.005, 0.36]} />
        <meshStandardMaterial color="#CAD6DD" roughness={0.85} />
      </mesh>
      <mesh position={[-0.05, 0.016, 0.08]}>
        <boxGeometry args={[0.14, 0.008, 0.035]} />
        <meshStandardMaterial color="#0E1210" />
      </mesh>
      <mesh position={[0.02, 0.016, 0.02]}>
        <boxGeometry args={[0.18, 0.008, 0.035]} />
        <meshStandardMaterial color="#0E1210" />
      </mesh>
      <mesh position={[-0.02, 0.018, -0.05]}>
        <boxGeometry args={[0.16, 0.01, 0.035]} />
        <meshStandardMaterial color="#D4FF4A" />
      </mesh>
    </group>
  )
}

function Board() {
  return (
    <group position={[0.72, 0.25, 0.12]} rotation={[0, -0.4, 0]}>
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 8]} />
        <meshStandardMaterial color="#3E5A6C" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 8]} />
        <meshStandardMaterial color="#3E5A6C" roughness={0.7} />
      </mesh>
      <mesh position={[0.05, 0.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.38, 0.035]} />
        <meshStandardMaterial color="#EEF1F0" roughness={0.8} />
      </mesh>
      <mesh position={[-0.06, 0.24, 0.02]}>
        <boxGeometry args={[0.1, 0.025, 0.012]} />
        <meshStandardMaterial color="#D4FF4A" />
      </mesh>
      <mesh position={[0.04, 0.16, 0.02]}>
        <boxGeometry args={[0.14, 0.025, 0.012]} />
        <meshStandardMaterial color="#D4FF4A" />
      </mesh>
      <mesh position={[0.12, 0.08, 0.02]}>
        <boxGeometry args={[0.1, 0.025, 0.012]} />
        <meshStandardMaterial color="#D4FF4A" />
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
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(MODEL, false, true)
  const clone = useMemo(() => cloneSkinned(scene) as THREE.Object3D, [scene])
  const { actions, mixer } = useAnimations(animations, group)
  const fade = reduced ? 0 : 0.3
  const readyOnce = useRef(false)

  useEffect(() => {
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    if (!readyOnce.current) {
      readyOnce.current = true
      onReady?.()
    }
  }, [clone, onReady])

  useEffect(() => {
    const clipName = CLIPS[role]
    const next = actions[clipName] ?? actions.idle
    if (!next) return
    Object.values(actions).forEach((a) => {
      if (a && a !== next) a.fadeOut(fade)
    })
    next.reset().fadeIn(fade).play()
    if (reduced) {
      next.paused = true
      next.time = Math.min(0.2, next.getClip().duration || 0.2)
    } else {
      next.paused = false
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    }
    return () => {
      next.fadeOut(fade)
    }
  }, [actions, role, reduced, fade])

  useFrame((_, dt) => {
    if (!reduced) mixer?.update(dt)
  })

  return (
    <group ref={group} position={[0, -1.05, 0]} rotation={[0, -0.25, 0]} scale={1.15}>
      <primitive object={clone} />
      {/* Hat as scene sibling — Kenney head bone scale makes portal hats tiny */}
      <group position={[0, 1.42, 0.06]}>
        <HardHat />
      </group>
      {role === "planner" && <Tablet />}
      {role === "pm" && <Board />}
    </group>
  )
}
