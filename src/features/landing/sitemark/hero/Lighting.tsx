import { useEffect, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import * as THREE from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"

const SUN: [number, number, number] = [16, 24, 12]

/**
 * Overcast sky with a low sun, built locally from light cards (no HDRI download): a bright
 * zenith, a pale horizon ring for the glass to reflect, and a darker ground bounce.
 */
function Sky() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.5}>
      <color attach="background" args={["#AEBBC2"]} />
      <Lightformer form="rect" color="#EEF3F5" intensity={2.4} position={[0, 40, 0]} rotation-x={Math.PI / 2} scale={[120, 120, 1]} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2
        return (
          <Lightformer
            key={i}
            form="rect"
            color="#DCE5EA"
            intensity={1.3}
            position={[Math.sin(a) * 50, 6, Math.cos(a) * 50]}
            rotation-y={a + Math.PI}
            scale={[100, 14, 1]}
          />
        )
      })}
      <Lightformer form="circle" color="#FFF1D8" intensity={6} position={SUN.map((v) => v * 2) as [number, number, number]} scale={8} target={[0, 0, 0]} />
      <Lightformer form="rect" color="#7E8C92" intensity={0.5} position={[0, -8, 0]} rotation-x={-Math.PI / 2} scale={[120, 120, 1]} />
    </Environment>
  )
}

/** Ground-truth ambient occlusion: it settles the building onto its slab and deepens reveals. */
function Occlusion() {
  const { gl, scene, camera, size } = useThree()
  const composer = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType })
    const c = new EffectComposer(gl, target)
    c.addPass(new RenderPass(scene, camera))
    const ao = new GTAOPass(scene, camera, 1, 1)
    ao.blendIntensity = 0.85
    ao.updateGtaoMaterial({ radius: 1.1, distanceExponent: 1.6, thickness: 2, scale: 1.2, samples: 12 })
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 12 })
    c.addPass(ao)
    c.addPass(new OutputPass())
    return c
  }, [gl, scene, camera])

  useEffect(() => {
    composer.setPixelRatio(Math.min(gl.getPixelRatio(), 1.5))
    composer.setSize(size.width, size.height)
  }, [composer, gl, size])
  useEffect(() => () => composer.dispose(), [composer])

  useFrame(() => composer.render(), 1)
  return null
}

export function Lighting() {
  return (
    <>
      <Sky />
      <hemisphereLight args={["#E8EEF2", "#7E8C92", 0.25]} />
      <directionalLight
        position={SUN}
        intensity={1.7}
        color="#FFF1DA"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-far={90}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
      />
      <Occlusion />
    </>
  )
}
