import * as THREE from "three"
import type { RolePalette } from "./roleLook"
import { ROLE_HIDE_MESHES } from "./roleLook"

export type SimplifyOpts = {
  /** Soft cap — Kenney worker has 2 meshes; excess beyond this are hidden by size. */
  maxMeshes?: number
  hideMeshes?: string[]
  palette: RolePalette
  bodyTint: string
  headTint: string
}

export type SimplifyReport = {
  remapped: string[]
  hidden: string[]
  materialsCreated: THREE.MeshStandardMaterial[]
}

function flatMaterial(color: string, roughness = 0.78): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.04,
  })
}

function shouldHide(name: string, hideList: string[]): boolean {
  const n = name.toLowerCase()
  return hideList.some((h) => n.includes(h.toLowerCase()))
}

/**
 * Reduce Kenney `worker.glb` for the ~280–360px Roles stage:
 * strip colormap PBR maps, flatten to Site Mark tones, hide noisy extras.
 *
 * Mutates `root` in place (call on a SkeletonUtils clone, never the cached scene).
 */
export function simplifyModel(root: THREE.Object3D, opts: SimplifyOpts): SimplifyReport {
  const hideList = [...ROLE_HIDE_MESHES, ...(opts.hideMeshes ?? [])]
  const maxMeshes = opts.maxMeshes ?? 4
  const remapped: string[] = []
  const hidden: string[] = []
  const materialsCreated: THREE.MeshStandardMaterial[] = []

  const bodyMat = flatMaterial(opts.bodyTint, 0.82)
  const headMat = flatMaterial(opts.headTint, 0.72)
  materialsCreated.push(bodyMat, headMat)

  const meshes: THREE.Mesh[] = []
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    meshes.push(mesh)
  })

  const ranked = [...meshes].sort((a, b) => {
    const score = (m: THREE.Mesh) => {
      const n = (m.name || "").toLowerCase()
      if (n.includes("body")) return 0
      if (n.includes("head")) return 1
      return 2
    }
    return score(a) - score(b)
  })

  ranked.forEach((mesh, index) => {
    const name = mesh.name || "(unnamed)"
    const overCap = index >= maxMeshes
    const listed = shouldHide(name, hideList)

    if (overCap || listed) {
      mesh.visible = false
      hidden.push(name)
      return
    }

    mesh.visible = true
    mesh.castShadow = true
    mesh.receiveShadow = true
    // Skinned bind poses often leave a stale bounding sphere → frustum culls the figure.
    mesh.frustumCulled = false

    const n = name.toLowerCase()
    const mat = n.includes("head") ? headMat : bodyMat
    mesh.material = mat
    mat.needsUpdate = true
    remapped.push(`${name} → ${mat === headMat ? "headTint" : "bodyTint"} (stripped colormap)`)
  })

  return { remapped, hidden, materialsCreated }
}

/** Update flat tints on materials previously created by simplifyModel. */
export function applyRoleTints(
  materials: THREE.MeshStandardMaterial[],
  bodyTint: string,
  headTint: string,
) {
  if (materials[0]) {
    materials[0].color.set(bodyTint)
    materials[0].needsUpdate = true
  }
  if (materials[1]) {
    materials[1].color.set(headTint)
    materials[1].needsUpdate = true
  }
}
