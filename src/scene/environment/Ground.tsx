import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getNoiseTexture } from '../noiseTexture'
import { story } from '../../lib/story'
import { TOXIC } from '../creature/organicMaterial'

const decalVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float pool = exp(-d * d * 5.0);
  float ring = exp(-pow((d - 0.55 - 0.03 * sin(uTime * 0.8)) * 9.0, 2.0)) * 0.25;
  gl_FragColor = vec4(uColor * (pool + ring) * uIntensity, 1.0);
}
`

const shadowFragment = /* glsl */ `
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  p.y *= 0.8;
  float d = length(p);
  gl_FragColor = vec4(0.0, 0.0, 0.0, (1.0 - smoothstep(0.0, 1.0, d)) * 0.78);
}
`

const scanFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uProgress;
varying vec2 vUv;
void main() {
  float fade = sin(3.14159 * clamp(uProgress, 0.0, 1.0));
  // a thin bright band at the floor that dissolves upward
  float band = exp(-vUv.y * 9.0) * 0.9 + exp(-vUv.y * 2.5) * 0.15;
  float a = band * fade * fade;
  gl_FragColor = vec4(uColor * a * 0.9, 1.0);
}
`

/** wet basalt floor, a light pool and soft contact shadow under the creature */
export function Ground({ time }: { time: THREE.IUniform<number> }) {
  const floorMaterial = useMemo(() => {
    const rough = getNoiseTexture().clone()
    rough.repeat.set(26, 26)
    rough.needsUpdate = true
    return new THREE.MeshStandardMaterial({
      color: '#050707',
      roughness: 1,
      metalness: 0.15,
      roughnessMap: rough,
      envMapIntensity: 0.6,
    })
  }, [])

  const glow = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: decalVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: TOXIC.clone() }, uIntensity: { value: 0.2 }, uTime: time },
      }),
    [time],
  )

  const shadow = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: decalVertex,
        fragmentShader: shadowFragment,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )

  const scan = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: decalVertex,
        fragmentShader: scanFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: TOXIC.clone() }, uProgress: { value: 0 } },
      }),
    [],
  )
  const scanGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1.6, 96, 1, true), [])

  useEffect(
    () => () => {
      floorMaterial.roughnessMap?.dispose()
      floorMaterial.dispose()
      glow.dispose()
      shadow.dispose()
      scan.dispose()
      scanGeometry.dispose()
    },
    [floorMaterial, glow, shadow, scan, scanGeometry],
  )

  useFrame(() => {
    const rig = story.rig
    glow.uniforms.uIntensity.value = 0.06 * rig.glow * (1 + rig.pulse * 1.5) * rig.reveal
    scan.uniforms.uProgress.value = rig.scan
  })

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={floorMaterial}>
        <circleGeometry args={[110, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, -0.4]} material={shadow} renderOrder={1}>
        <planeGeometry args={[4.2, 5.6]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} material={glow} renderOrder={1}>
        <planeGeometry args={[14, 14]} />
      </mesh>
      <ScanWave material={scan} geometry={scanGeometry} />
    </group>
  )
}

function ScanWave({ material, geometry }: { material: THREE.ShaderMaterial; geometry: THREE.CylinderGeometry }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const m = ref.current
    if (!m) return
    const p = story.rig.scan
    m.visible = p > 0.001 && p < 0.999
    const r = 0.5 + p * 16
    m.scale.set(r, 1, r)
  })
  return <mesh ref={ref} geometry={geometry} material={material} position={[0, 0.8, 0.8]} renderOrder={3} visible={false} />
}
