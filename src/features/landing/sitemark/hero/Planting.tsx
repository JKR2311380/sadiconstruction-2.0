import * as THREE from "three"
import { siteMaterials } from "./materials"

const BLOB = new THREE.IcosahedronGeometry(1, 3)
const TRUNK = new THREE.CylinderGeometry(0.07, 0.12, 1, 7)

/** Deterministic 0–1 jitter so each tree keeps its shape across renders. */
const jitter = (seed: number) => {
  const s = Math.sin(seed * 127.1) * 43758.5453
  return s - Math.floor(s)
}

/** A clear-stem street tree: trunk, then a loose crown of overlapping leaf masses. */
export function Tree({ x, z, height = 6, seed = 0, y = 0 }: { x: number; z: number; height?: number; seed?: number; y?: number }) {
  const m = siteMaterials()
  const stem = height * 0.42
  const r = height * 0.2
  const crown: Array<[number, number, number, number]> = [[0, stem + r * 1.2, 0, r]]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + jitter(seed + i) * 0.8
    const spread = r * (0.55 + jitter(seed + i + 7) * 0.35)
    crown.push([
      Math.cos(a) * spread,
      stem + r * (0.8 + jitter(seed + i + 3) * 0.9),
      Math.sin(a) * spread,
      r * (0.55 + jitter(seed + i + 11) * 0.25),
    ])
  }
  return (
    <group position={[x, y, z]} rotation-y={jitter(seed + 2) * Math.PI}>
      <mesh geometry={TRUNK} material={m.trunk} position={[0, stem / 2 + r * 0.3, 0]} scale={[1, stem + r * 0.6, 1]} castShadow />
      {crown.map(([cx, cy, cz, s], i) => (
        <mesh key={i} geometry={BLOB} material={m.foliage} position={[cx, cy, cz]} scale={[s, s * 0.86, s]} castShadow receiveShadow />
      ))}
    </group>
  )
}

/** Low planting: a loose clump of small faceted masses. */
export function Shrubs({ x, z, width, depth, y = 0, seed = 0 }: { x: number; z: number; width: number; depth: number; y?: number; seed?: number }) {
  const m = siteMaterials()
  const count = Math.max(2, Math.round((width * depth) / 1.4))
  return (
    <group position={[x, y, z]}>
      {Array.from({ length: count }, (_, i) => {
        const s = 0.32 + jitter(seed + i * 3) * 0.28
        const px = (jitter(seed + i * 3 + 1) - 0.5) * (width - s * 2)
        const pz = (jitter(seed + i * 3 + 2) - 0.5) * (depth - s * 2)
        return <mesh key={i} geometry={BLOB} material={m.foliage} position={[px, s * 0.7, pz]} scale={[s, s * 0.8, s]} castShadow receiveShadow />
      })}
    </group>
  )
}
