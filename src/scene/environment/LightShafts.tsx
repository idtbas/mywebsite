import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getNoiseTexture } from '../noiseTexture'
import { story } from '../../lib/story'

const vertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const fragment = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uSeed;
uniform vec3 uColor;
uniform sampler2D uNoise;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
void main() {
  float facing = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
  float h = vUv.y;
  float vertical = smoothstep(0.0, 0.3, h) * (1.0 - smoothstep(0.88, 1.0, h)) * mix(0.25, 1.0, h);
  float dust = texture2D(uNoise, vec2(vUv.x * 2.0 + uSeed, h * 0.7 - uTime * 0.018)).r;
  float a = facing * vertical * (0.45 + dust * 0.9) * uIntensity;
  gl_FragColor = vec4(uColor * a, 1.0);
}
`

interface Shaft {
  pos: [number, number, number]
  rot: [number, number, number]
  radius: [number, number]
  height: number
  intensity: number
}

const SHAFTS: Shaft[] = [
  { pos: [0.4, 6.2, 0.6], rot: [0.08, 0, -0.12], radius: [0.25, 2.6], height: 12, intensity: 0.11 },
  { pos: [-2.6, 6.8, -1.6], rot: [0.12, 0, 0.22], radius: [0.15, 1.8], height: 13, intensity: 0.07 },
  { pos: [3.2, 7, -2.4], rot: [-0.05, 0, -0.3], radius: [0.15, 1.6], height: 14, intensity: 0.06 },
]

/** cheap fake volumetric light – additive cones that fade at their silhouettes */
export function LightShafts({ time }: { time: THREE.IUniform<number> }) {
  const items = useMemo(
    () =>
      SHAFTS.map((s, i) => ({
        ...s,
        geometry: new THREE.CylinderGeometry(s.radius[0], s.radius[1], s.height, 40, 1, true),
        material: new THREE.ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: fragment,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: time,
            uIntensity: { value: s.intensity },
            uSeed: { value: i * 0.37 },
            uColor: { value: new THREE.Color('#dbeee2') },
            uNoise: { value: getNoiseTexture() },
          },
        }),
      })),
    [time],
  )

  useEffect(
    () => () =>
      items.forEach((it) => {
        it.geometry.dispose()
        it.material.dispose()
      }),
    [items],
  )

  useFrame(() => {
    items.forEach((it) => {
      it.material.uniforms.uIntensity.value = it.intensity * story.rig.shafts
    })
  })

  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos} rotation={it.rot} geometry={it.geometry} material={it.material} renderOrder={3} />
      ))}
    </group>
  )
}
