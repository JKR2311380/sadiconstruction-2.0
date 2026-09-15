import { useEffect, useRef } from "react"
import * as THREE from "three"

function smooth(t) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

function mix(a, b, t) {
  return a + (b - a) * t
}

function sampleCam(p) {
  const keys = [
    { p: 0, az: 0.78, pol: 0.58, r: 18.5, fov: 32, tx: 0.2, ty: 2.4, tz: 0.2 },
    { p: 0.16, az: 0.12, pol: 0.5, r: 13.2, fov: 30, tx: -3.6, ty: 2.7, tz: 0.3 },
    { p: 0.34, az: -0.7, pol: 0.48, r: 9.6, fov: 28, tx: -4.4, ty: 2.85, tz: 0.15 },
    { p: 0.52, az: 1.22, pol: 0.5, r: 11.2, fov: 28, tx: 0.8, ty: 2.65, tz: 0.85 },
    { p: 0.7, az: 1.58, pol: 0.54, r: 10.4, fov: 27, tx: 3.6, ty: 2.75, tz: 1.15 },
    { p: 0.86, az: 2.48, pol: 0.62, r: 12.2, fov: 30, tx: 3.1, ty: 3.1, tz: 0.35 },
    { p: 1, az: 3.4, pol: 0.55, r: 17.8, fov: 33, tx: 0.15, ty: 2.5, tz: 0.15 },
  ]
  let i = 0
  while (i < keys.length - 2 && p > keys[i + 1].p) i += 1
  const a = keys[i]
  const b = keys[i + 1]
  const t = smooth((p - a.p) / Math.max(0.0001, b.p - a.p))
  return {
    az: mix(a.az, b.az, t),
    pol: mix(a.pol, b.pol, t),
    r: mix(a.r, b.r, t),
    fov: mix(a.fov, b.fov, t),
    tx: mix(a.tx, b.tx, t),
    ty: mix(a.ty, b.ty, t),
    tz: mix(a.tz, b.tz, t),
  }
}

const VOLUMES = [
  { g: "site", m: "slab", x: 0, z: 0.15, y: 0, w: 16.8, h: 0.52, d: 9.4 },
  { g: "site", m: "stone", x: -6.1, z: 3.55, y: 0, w: 4.0, h: 0.82, d: 2.6 },
  { g: "site", m: "stone", x: 6.4, z: -3.45, y: 0, w: 3.2, h: 0.68, d: 2.5 },
  { g: "site", m: "slab", x: -6.8, z: -3.1, y: 0, w: 2.6, h: 0.4, d: 2.2 },

  { g: "frame", m: "core", x: -5.5, z: -0.35, y: 0.52, w: 5.2, h: 1.55, d: 4.6 },
  { g: "frame", m: "core", x: -5.7, z: 1.85, y: 0.52, w: 3.4, h: 2.35, d: 2.3 },
  { g: "frame", m: "core", x: -3.6, z: -2.25, y: 0.52, w: 6.6, h: 1.12, d: 2.35 },
  { g: "frame", m: "core", x: -6.2, z: -1.4, y: 0.52, w: 2.4, h: 1.9, d: 2.0 },
  { g: "frame", m: "core", x: -0.15, z: -1.45, y: 0.52, w: 5.0, h: 2.75, d: 2.6 },
  { g: "frame", m: "core", x: 0.55, z: 2.65, y: 0.52, w: 3.7, h: 3.55, d: 2.2 },
  { g: "frame", m: "core", x: 1.35, z: -2.05, y: 0.52, w: 3.3, h: 1.75, d: 2.15 },
  { g: "frame", m: "core", x: -1.25, z: 0.45, y: 3.25, w: 2.7, h: 1.35, d: 2.35 },
  { g: "frame", m: "core", x: 4.55, z: 0.35, y: 0.52, w: 6.4, h: 2.15, d: 5.1 },
  { g: "frame", m: "core", x: 5.85, z: 1.85, y: 2.65, w: 3.5, h: 1.55, d: 2.35 },
  { g: "frame", m: "core", x: 3.85, z: -1.85, y: 0.52, w: 4.1, h: 1.35, d: 2.55 },
  { g: "frame", m: "core", x: 6.65, z: -0.55, y: 0.52, w: 2.25, h: 3.35, d: 2.05 },
  { g: "frame", m: "stone", x: -2.8, z: 2.55, y: 0.52, w: 2.2, h: 1.05, d: 1.6 },
  { g: "frame", m: "stone", x: 2.4, z: 3.05, y: 0.52, w: 2.8, h: 0.95, d: 1.5 },

  { g: "envelope", m: "glass", x: -2.15, z: 1.55, y: 1.05, w: 2.45, h: 1.85, d: 2.05 },
  { g: "envelope", m: "glass", x: 1.75, z: 0.15, y: 1.35, w: 2.25, h: 1.65, d: 1.85 },
  { g: "envelope", m: "glass", x: 4.45, z: 2.05, y: 1.15, w: 2.85, h: 1.75, d: 1.65 },
  { g: "envelope", m: "glass", x: 5.25, z: -0.15, y: 1.55, w: 2.05, h: 1.45, d: 1.55 },
  { g: "envelope", m: "glass", x: 2.55, z: -1.55, y: 0.95, w: 1.85, h: 1.25, d: 1.45 },
  { g: "envelope", m: "glass", x: -4.4, z: 0.9, y: 1.15, w: 1.7, h: 1.4, d: 1.5 },

  { g: "path", m: "path", x: -4.85, z: 0.2, y: 2.55, w: 2.8, h: 0.82, d: 1.22 },
  { g: "path", m: "path", x: -2.2, z: 0.45, y: 2.55, w: 2.7, h: 0.82, d: 1.22 },
  { g: "path", m: "path", x: 0.2, z: 0.85, y: 2.55, w: 2.4, h: 0.82, d: 1.28 },
  { g: "path", m: "path", x: 2.5, z: 1.25, y: 2.55, w: 2.5, h: 0.82, d: 1.28 },
  { g: "path", m: "path", x: 4.55, z: 1.5, y: 2.55, w: 2.2, h: 0.82, d: 1.32 },
  { g: "path", m: "path", x: 5.95, z: 1.55, y: 2.55, w: 1.5, h: 2.15, d: 1.5 },
]

const GROW = {
  site: { from: -1, to: -0.4 },
  frame: { from: -0.85, to: 0.32 },
  envelope: { from: 0.22, to: 0.58 },
  path: { from: 0.42, to: 0.82 },
}

function makeVolume(unit, mats, edgeMat, spec) {
  const mat = mats[spec.m]
  const mesh = new THREE.Mesh(unit, mat)
  mesh.position.set(spec.x, spec.y + spec.h / 2, spec.z)
  mesh.scale.set(spec.w, spec.h, spec.d)
  mesh.castShadow = spec.g !== "site"
  mesh.receiveShadow = true
  mesh.userData = { ...spec }
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(unit), edgeMat)
  edges.raycast = () => {}
  mesh.add(edges)
  return mesh
}

export function ClearwaterMassing({ progressRef, reduced }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#181822")
    scene.fog = new THREE.Fog("#181822", 28, 58)

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 90)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.domElement.style.display = "block"
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    host.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight("#d7e0e6", "#1c1e26", 0.95))
    const key = new THREE.DirectionalLight("#fff6ea", 1.85)
    key.position.set(14, 20, 10)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 2
    key.shadow.camera.far = 48
    key.shadow.camera.left = -18
    key.shadow.camera.right = 18
    key.shadow.camera.top = 18
    key.shadow.camera.bottom = -18
    key.shadow.bias = -0.0004
    scene.add(key)
    const fill = new THREE.DirectionalLight("#6d8b96", 0.55)
    fill.position.set(-10, 8, -8)
    scene.add(fill)
    const rim = new THREE.DirectionalLight("#cf3b35", 0.18)
    rim.position.set(-6, 4, 12)
    scene.add(rim)

    const unit = new THREE.BoxGeometry(1, 1, 1)
    const mats = {
      slab: new THREE.MeshStandardMaterial({ color: "#e6e8ee", roughness: 0.58, metalness: 0.04 }),
      stone: new THREE.MeshStandardMaterial({ color: "#c4c8d0", roughness: 0.7, metalness: 0.02 }),
      core: new THREE.MeshStandardMaterial({ color: "#eceef3", roughness: 0.46, metalness: 0.05 }),
      glass: new THREE.MeshStandardMaterial({
        color: "#5b8a9a",
        roughness: 0.16,
        metalness: 0.18,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      path: new THREE.MeshStandardMaterial({
        color: "#cf3b35",
        emissive: "#8e1d16",
        emissiveIntensity: 0.22,
        roughness: 0.38,
        metalness: 0.08,
      }),
    }
    const edgeMat = new THREE.LineBasicMaterial({ color: "#2a313a", transparent: true, opacity: 0.72 })
    const floorMat = new THREE.MeshStandardMaterial({ color: "#14151c", roughness: 1, metalness: 0 })

    const floor = new THREE.Mesh(unit, floorMat)
    floor.scale.set(56, 0.08, 56)
    floor.position.y = -0.04
    floor.receiveShadow = true
    scene.add(floor)

    const grid = new THREE.GridHelper(36, 36, "#3a4250", "#232830")
    grid.position.y = 0.01
    scene.add(grid)

    const meshes = VOLUMES.map((spec) => {
      const mesh = makeVolume(unit, mats, edgeMat, spec)
      scene.add(mesh)
      return mesh
    })

    const look = new THREE.Vector3()
    const camPos = new THREE.Vector3()
    const lookNow = new THREE.Vector3()
    const camNow = new THREE.Vector3()
    let booted = false

    const apply = (p, snap) => {
      meshes.forEach((mesh) => {
        const spec = mesh.userData
        const range = GROW[spec.g]
        const t = smooth((p - range.from) / Math.max(0.0001, range.to - range.from))
        const grow = spec.g === "site" ? Math.max(0.55, t) : t
        mesh.scale.set(spec.w, Math.max(0.02, grow) * spec.h, spec.d)
        mesh.position.y = spec.y + mesh.scale.y / 2
        mesh.visible = grow > 0.03
        mesh.children.forEach((child) => {
          child.visible = grow > 0.08
        })
      })
      mats.path.emissiveIntensity = 0.18 + smooth((p - 0.48) / 0.42) * 0.95
      edgeMat.opacity = 0.42 + smooth(p) * 0.18

      const cam = sampleCam(p)
      look.set(cam.tx, cam.ty, cam.tz)
      camPos.set(
        look.x + Math.sin(cam.az) * Math.cos(cam.pol) * cam.r,
        look.y + Math.sin(cam.pol) * cam.r,
        look.z + Math.cos(cam.az) * Math.cos(cam.pol) * cam.r,
      )
      const k = snap || !booted ? 1 : 0.11
      camNow.lerp(camPos, k)
      lookNow.lerp(look, k)
      camera.position.copy(camNow)
      camera.lookAt(lookNow)
      if (Math.abs(camera.fov - cam.fov) > 0.05) {
        camera.fov = mix(camera.fov, cam.fov, k)
        camera.updateProjectionMatrix()
      }
      booted = true
    }

    const resize = () => {
      const w = host.clientWidth
      const h = Math.max(1, host.clientHeight)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    apply(reduced ? 1 : progressRef.current, true)

    let raf = 0
    const tick = () => {
      apply(reduced ? 1 : progressRef.current, reduced)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      unit.dispose()
      Object.values(mats).forEach((m) => m.dispose())
      edgeMat.dispose()
      floorMat.dispose()
      meshes.forEach((mesh) => {
        mesh.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose()
        })
      })
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }
  }, [progressRef, reduced])

  return (
    <div
      ref={hostRef}
      className="seq-canvas"
      role="img"
      aria-label="Interactive 3D massing of Clearwater Medical Center. Scroll to orbit, zoom, and pan the programme."
    />
  )
}
