import { Suspense, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { ContactShadows, Grid } from "@react-three/drei"
import { CampusMassing } from "./CampusMassing"
import { CAMERA_POSES, StageRig } from "./StageRig"

function StepInvalidate({ step }: { step: number }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidate()
  }, [invalidate, step])
  return null
}

function Scene({ currentStep, reduced }: { currentStep: number; reduced: boolean }) {
  return (
    <>
      <color attach="background" args={["#1A1514"]} />
      <fog attach="fog" args={["#1A1514", 28, 56]} />
      <hemisphereLight args={["#F5F5DC", "#3A2A1C", 0.48]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[-11, 18, 9]}
        intensity={1.28}
        color="#fff6e8"
        castShadow={!reduced}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={55}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <directionalLight position={[10, 6, -6]} intensity={0.22} color="#e8c547" />
      <StageRig currentStep={currentStep} reduced={reduced} orbit={false} />
      <CampusMassing currentStep={currentStep} reduced={reduced} />
      <Grid
        position={[0, 0.01, 0]}
        args={[48, 48]}
        cellSize={1}
        cellThickness={0.35}
        cellColor="#3a3228"
        sectionSize={5}
        sectionThickness={0.7}
        sectionColor="#5a4a32"
        fadeDistance={38}
        fadeStrength={1.4}
        infiniteGrid
      />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.38} scale={36} blur={2.8} far={12} />
    </>
  )
}

export function FormworkCanvas({
  currentStep,
  reduced,
  active = true,
}: {
  currentStep: number
  reduced: boolean
  active?: boolean
}) {
  const start = CAMERA_POSES[Math.min(currentStep, CAMERA_POSES.length - 1)] ?? CAMERA_POSES[0]
  const run = active && !reduced

  return (
    <Canvas
      className="formwork-canvas h-full w-full"
      camera={{
        position: start.pos.toArray(),
        fov: start.fov,
        near: 0.1,
        far: 120,
      }}
      dpr={reduced ? [1, 1] : [1, 1.25]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      shadows={!reduced}
      frameloop={run ? "always" : "demand"}
      onCreated={(state) => {
        state.camera.lookAt(start.target.x, start.target.y, start.target.z)
        state.invalidate()
      }}
    >
      <Suspense fallback={null}>
        <StepInvalidate step={currentStep} />
        <Scene currentStep={currentStep} reduced={reduced} />
      </Suspense>
    </Canvas>
  )
}
