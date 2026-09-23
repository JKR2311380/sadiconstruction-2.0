import { Suspense, lazy, useCallback, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { ContactShadows } from "@react-three/drei"
import { Mascot, type RoleId } from "../Mascot"

const WorkerModel = lazy(() =>
  import("./WorkerModel").then((m) => ({ default: m.WorkerModel })),
)

function Scene({ role, reduced, onReady }: { role: RoleId; reduced: boolean; onReady: () => void }) {
  return (
    <>
      <color attach="background" args={["#D6DAD6"]} />
      <hemisphereLight args={["#CAD6DD", "#BCC3BF", 0.85]} />
      <directionalLight position={[4, 8, 5]} intensity={1.4} color="#FFF6E8" castShadow shadow-mapSize={[512, 512]} />
      <directionalLight position={[-3, 4, -2]} intensity={0.35} color="#3E5A6C" />
      <Suspense fallback={null}>
        <WorkerModel role={role} reduced={reduced} onReady={onReady} />
      </Suspense>
      <ContactShadows position={[0, -0.95, 0]} opacity={0.35} scale={6} blur={2.2} far={4} />
    </>
  )
}

export function RoleFigure({
  role,
  reduced,
  near,
}: {
  role: RoleId
  reduced: boolean
  near: boolean
}) {
  const [webglOk, setWebglOk] = useState(true)
  const [modelReady, setModelReady] = useState(false)
  const onReady = useCallback(() => setModelReady(true), [])
  const showCanvas = near && webglOk

  return (
    <div className="sm-roles__figure-stage">
      {showCanvas && (
        <Canvas
          className="sm-roles__canvas"
          camera={{ position: [2.1, 1.0, 3.4], fov: 28, near: 0.1, far: 40 }}
          dpr={[1, 1.5]}
          shadows
          frameloop={reduced ? "demand" : "always"}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ camera, gl }) => {
            camera.lookAt(0, 0.2, 0)
            gl.domElement.addEventListener("webglcontextlost", () => setWebglOk(false), { once: true })
          }}
        >
          <Scene role={role} reduced={reduced} onReady={onReady} />
        </Canvas>
      )}
      {(!showCanvas || !modelReady) && (
        <div className="sm-roles__figure-fallback" aria-hidden={modelReady || undefined}>
          <Mascot role={role} reduced={reduced} />
        </div>
      )}
    </div>
  )
}
