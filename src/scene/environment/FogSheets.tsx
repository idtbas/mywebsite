import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getNoiseTexture } from '../noiseTexture'
import { story } from '../../lib/story'

export interface Sheet {
  pos: [number, number, number]
  size: [number, number]
  opacity: number
  color: string
  additive?: boolean
  seed: number
}

const vertex = /* glsl */ `
uniform vec2 uSize;
varying vec2 vUv;
varying float vDist;
void main() {
  vUv = uv;
  // camera-facing billboard: offset the corners in view space
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * uSize;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`

const fragment = /* glsl */ `
uniform sampler2D uNoise;
uniform float uTime;
uniform float uOpacity;
uniform float uSeed;
uniform vec3 uColor;
varying vec2 vUv;
varying float vDist;
void main() {
  vec2 uv = vUv;
  float n1 = texture2D(uNoise, uv * 0.85 + vec2(uTime * 0.011 + uSeed, uTime * 0.004)).r;
  float n2 = texture2D(uNoise, uv * 1.8 + vec2(-uTime * 0.016, uSeed * 1.7 + uTime * 0.007)).g;
  float m = smoothstep(0.3, 0.8, n1 * 0.62 + n2 * 0.48);
  vec2 e = abs(uv - 0.5) * 2.0;
  float edge = (1.0 - smoothstep(0.4, 1.0, e.x)) * (1.0 - smoothstep(0.25, 1.0, e.y));
  float nearFade = smoothstep(0.8, 4.5, vDist);
  float farFade = 1.0 - smoothstep(26.0, 44.0, vDist);
  float a = m * edge * nearFade * farFade * uOpacity;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
`

/**
 * Layers of drifting haze. Each layer always faces the camera and dissolves
 * as the camera flies through it, which sells the depth of the space.
 */
export function FogSheets({ sheets, time }: { sheets: Sheet[]; time: THREE.IUniform<number> }) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const materials = useMemo(
    () =>
      sheets.map(
        (s) =>
          new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            transparent: true,
            depthWrite: false,
            blending: s.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
            uniforms: {
              uNoise: { value: getNoiseTexture() },
              uTime: time,
              uOpacity: { value: s.opacity },
              uSeed: { value: s.seed },
              uSize: { value: new THREE.Vector2(...s.size) },
              uColor: { value: new THREE.Color(s.color) },
            },
          }),
      ),
    [sheets, time],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  useFrame(() => {
    // denser story fog → denser haze layers
    const haze = THREE.MathUtils.clamp(0.55 + story.rig.fog * 9, 0.4, 1.8)
    materials.forEach((m, i) => {
      m.uniforms.uOpacity.value = sheets[i].opacity * haze
    })
  })

  return (
    <group>
      {sheets.map((s, i) => (
        <mesh
          key={i}
          position={s.pos}
          geometry={geometry}
          material={materials[i]}
          frustumCulled={false}
          renderOrder={2}
        />
      ))}
    </group>
  )
}
