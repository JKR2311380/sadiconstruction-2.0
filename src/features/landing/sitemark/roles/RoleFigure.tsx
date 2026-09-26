import { Component, Suspense, lazy, useCallback, useState, type ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { ContactShadows } from "@react-three/drei"
import { Mascot, type RoleId } from "../Mascot"
import { ROLE_LOOKS } from "./roleLook"

const WorkerModel = lazy(() =>
  import("./WorkerModel").then((m) => ({ default: m.WorkerModel })),
)

class FigureErrorBoundary extends Component<
  { fallback: ReactNode; onFail?: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn("[Roles/RoleFigure] 3D figure failed, using SVG mascot.", err)
    this.props.onFail?.()
  }
  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

function Scene({ role, reduced, onReady }: { role: RoleId; reduced: boolean; onReady: () => void }) {
  return (
    <>
      <color attach="background" args={["#D6DAD6"]} />
      <hemisphereLight args={["#CAD6DD", "#BCC3BF", 0.9]} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.3}
        color="#FFF6E8"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.35} color="#3E5A6C" />
      <Suspense fallback={null}>
        <WorkerModel role={role} reduced={reduced} onReady={onReady} />
      </Suspense>
      <ContactShadows position={[0, -0.95, 0]} opacity={0.32} scale={6} blur={2.2} far={4} />
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
  const [figureFailed, setFigureFailed] = useState(false)
  const onReady = useCallback(() => setModelReady(true), [])
  const showCanvas = near && webglOk && !figureFailed
  const frame = ROLE_LOOKS[role].frame
  const mascot = <Mascot role={role} reduced={reduced} />

  return (
    <div className="sm-roles__figure-stage" aria-hidden>
      {showCanvas && (
        <FigureErrorBoundary
          onFail={() => setFigureFailed(true)}
          fallback={<div className="sm-roles__figure-fallback">{mascot}</div>}
        >
          <Canvas
            className="sm-roles__canvas"
            camera={{ position: frame.camera, fov: frame.fov, near: 0.1, far: 40 }}
            dpr={[1, 1.5]}
            shadows="percentage"
            frameloop={reduced ? "demand" : "always"}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            onCreated={({ camera, gl }) => {
              camera.lookAt(...frame.lookAt)
              gl.domElement.addEventListener(
                "webglcontextlost",
                () => {
                  setWebglOk(false)
                  setFigureFailed(true)
                },
                { once: true },
              )
            }}
          >
            <Scene role={role} reduced={reduced} onReady={onReady} />
          </Canvas>
        </FigureErrorBoundary>
      )}
      {(!showCanvas || !modelReady) && (
        <div
          className="sm-roles__figure-fallback"
          aria-hidden={modelReady && showCanvas ? true : undefined}
        >
          {mascot}
        </div>
      )}
    </div>
  )
}
