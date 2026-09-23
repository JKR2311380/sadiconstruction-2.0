import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { CameraControls } from "@react-three/drei"
import * as THREE from "three"

export type Pose = {
  pos: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

export const CAMERA_POSES: Pose[] = [
  { pos: new THREE.Vector3(8.4, 3.2, 11.2), target: new THREE.Vector3(0.6, 0.1, 0.1), fov: 32 },
  { pos: new THREE.Vector3(-2.2, 6.8, 12.4), target: new THREE.Vector3(-6.0, 1.0, -1.2), fov: 30 },
  { pos: new THREE.Vector3(4.8, 7.2, 11.6), target: new THREE.Vector3(0.2, 1.2, 1.0), fov: 30 },
  { pos: new THREE.Vector3(10.4, 8.6, 9.8), target: new THREE.Vector3(1.4, 1.6, 1.4), fov: 28 },
  { pos: new THREE.Vector3(9.2, 5.4, 8.8), target: new THREE.Vector3(3.6, 1.1, 1.8), fov: 30 },
  { pos: new THREE.Vector3(16.8, 9.4, 10.2), target: new THREE.Vector3(8.4, 2.4, 0.2), fov: 28 },
  { pos: new THREE.Vector3(18.8, 13.6, 16.2), target: new THREE.Vector3(0.4, 1.5, 0.1), fov: 26 },
]

const LERP = 0.05

type ControlsHandle = {
  setLookAt: (
    x: number,
    y: number,
    z: number,
    tx: number,
    ty: number,
    tz: number,
    enableTransition?: boolean,
  ) => unknown
  enabled: boolean
}

export function StageRig({
  currentStep,
  reduced,
  orbit = true,
}: {
  currentStep: number
  reduced: boolean
  orbit?: boolean
}) {
  const { camera } = useThree()
  const persp = camera as THREE.PerspectiveCamera
  const controls = useRef<ControlsHandle | null>(null)
  const stepRef = useRef(currentStep)
  const reducedRef = useRef(reduced)
  const orbitRef = useRef(orbit)
  const pos = useRef(CAMERA_POSES[0].pos.clone())
  const look = useRef(CAMERA_POSES[0].target.clone())

  stepRef.current = currentStep
  reducedRef.current = reduced
  orbitRef.current = orbit

  useEffect(() => {
    if (!reduced) return
    const pose = CAMERA_POSES[currentStep] ?? CAMERA_POSES[0]
    pos.current.copy(pose.pos)
    look.current.copy(pose.target)
    persp.position.copy(pose.pos)
    persp.fov = pose.fov
    persp.updateProjectionMatrix()
    controls.current?.setLookAt(
      pose.pos.x,
      pose.pos.y,
      pose.pos.z,
      pose.target.x,
      pose.target.y,
      pose.target.z,
      false,
    )
  }, [currentStep, persp, reduced])

  useFrame((_, delta) => {
    if (reducedRef.current) return
    const pose = CAMERA_POSES[stepRef.current] ?? CAMERA_POSES[0]
    const k = 1 - Math.pow(1 - LERP, delta * 60)
    pos.current.lerp(pose.pos, k)
    look.current.lerp(pose.target, k)
    persp.fov = THREE.MathUtils.lerp(persp.fov, pose.fov, k)
    persp.updateProjectionMatrix()
    controls.current?.setLookAt(
      pos.current.x,
      pos.current.y,
      pos.current.z,
      look.current.x,
      look.current.y,
      look.current.z,
      false,
    )
    if (controls.current) {
      controls.current.enabled = orbitRef.current && pos.current.distanceTo(pose.pos) < 0.08
    }
  })

  return (
    <CameraControls
      ref={controls as never}
      makeDefault
      enabled={orbit}
      smoothTime={0}
      draggingSmoothTime={0}
      dollyToCursor={false}
      azimuthRotateSpeed={0.35}
      polarRotateSpeed={0.35}
    />
  )
}
