import { Suspense, useRef, type MutableRefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { ContactShadows, Grid } from "@react-three/drei"
import { FormworkTower } from "./FormworkTower"

type ProgressRef = MutableRefObject<number>

function Rig({ progressRef }: { progressRef: ProgressRef }) {
  const { camera } = useThree()
  const look = useRef({ y: 0.3 })

  useFrame(() => {
    const t = progressRef.current
    camera.position.x = 8.6 + t * 3.8
    camera.position.y = 2.8 + t * 7.0
    camera.position.z = 9.8 + t * 2.6
    look.current.y = -0.35 + t * 5.1
    camera.lookAt(0.2, look.current.y, 0)
  })

  return null
}

function Scene({ progressRef }: { progressRef: ProgressRef }) {
  return (
    <>
      <color attach="background" args={["#222421"]} />
      <fog attach="fog" args={["#222421", 26, 58]} />
      <hemisphereLight args={["#D0D6D4", "#6A5C4C", 0.7]} />
      <ambientLight intensity={0.42} />
      <directionalLight
        position={[12, 16, 8]}
        intensity={1.85}
        color="#FFF3DC"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={16}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.35} color="#8FA3B0" />
      <Rig progressRef={progressRef} />
      {/* Swap point: replace FormworkTower with a GLTF group sharing this origin. */}
      <FormworkTower progressRef={progressRef} />
      <Grid
        position={[0, 0.01, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#8A8C84"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#C4A06A"
        fadeDistance={38}
        fadeStrength={1.4}
        infiniteGrid
      />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.38} scale={28} blur={2.4} far={10} />
    </>
  )
}

export function FormworkCanvas({
  progressRef,
  reduced,
}: {
  progressRef: ProgressRef
  reduced: boolean
}) {
  return (
    <Canvas
      className="formwork-canvas"
      camera={{ position: [9.2, 3.6, 10.4], fov: 34, near: 0.1, far: 90 }}
      dpr={reduced ? [1, 1] : [1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      shadows={!reduced ? "percentage" : false}
      frameloop={reduced ? "demand" : "always"}
      onCreated={(state) => {
        if (reduced) state.invalidate()
      }}
    >
      <Suspense fallback={null}>
        <Scene progressRef={progressRef} />
      </Suspense>
    </Canvas>
  )
}
